import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Release } from 'src/entities/Release';
import { Repository } from 'src/entities/Repository';
import { CreateReleaseDto } from './dto/CreateReleaseDto';
import { In, Repository as TypeOrmRepository } from 'typeorm';
import { TagsService } from '../tags/tags.service';
import { UpdateReleaseDto } from './dto/UpdateReleaseDto';
import { ReleaseDownload } from 'src/entities/ReleaseDownload';
import { instanceToPlain } from 'class-transformer';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';
import { Collaboration } from 'src/entities/Collaboration';

@Injectable()
export class ReleasesService {

	public constructor(
		@InjectRepository(Release) private readonly repository: TypeOrmRepository<Release>,
		private readonly tags: TagsService,
	) {}

	/**
	 * Gets a release from its version string. Returns `null` if not found.
	 *
	 * @param repo
	 * @param version
	 */
	public async getFromVersion(repo: Repository, version: string) {
		return this.repository.findOne({
			where: {
				repository: { id: repo.id },
				version
			}
		});
	}

	/**
	 * Gets a release from its version string. Throws an exception if not found.
	 *
	 * @param repo
	 * @param version
	 */
	public async getFromVersionOrFail(repo: Repository, version: string) {
		const release = await this.getFromVersion(repo, version);

		if (!release) {
			throw new NotFoundException(`No version matching '${version}' exists within the repository`);
		}

		return release;
	}

	/**
	 * Searches for releases.
	 *
	 * @param repo
	 * @param collaboration
	 * @param params
	 * @returns
	 */
	public async search(repo: Repository, collaboration: Collaboration | undefined, params: ReleaseSearchParams) {
		// Get all available tag names
		const tags = await this.tags.getAllTags(repo);

		// Allow constraints to be set to a tag name
		if (tags.includes(params.constraint?.toLowerCase().trim())) {
			params.tags = [params.constraint.toLowerCase().trim()];
			params.constraint = undefined;
		};

		// Narrow down all version numbers matching our criteria
		const matches = await this.getFilteredVersions(repo, params, collaboration);

		// Narrow them down further with the version constraint and sort using the driver
		const filtered = repo.driver.getVersionsFromConstraint(matches, params.constraint ?? '*');
		const sorted = params.sort === 'version' ? repo.driver.getVersionsSorted(filtered, params.sort_order) : filtered;

		// Artificial limiter when assets are enabled
		if (params.includeAttachments) {
			if (params.count === 0 || params.count > 100) {
				params.count = 100;
			}
		}

		// Calculate pagination
		const numResults = sorted.length;
		const numPages = params.count === 0 ? 1 : Math.max(1, Math.ceil(numResults / params.count));
		const currentPage = Math.min(Math.max(1, params.page), numPages);
		const currentPageSize = params.count === 0 ? numResults : params.count;
		const sliceStartIndex = (currentPage * currentPageSize) - currentPageSize;
		const sliceEndIndex = sliceStartIndex + currentPageSize;
		const sliced = sorted.slice(sliceStartIndex, sliceEndIndex);

		// Build query manually to take control over subqueries
		const query = this.repository.createQueryBuilder();
		query.leftJoinAndSelect('Release.tags', 'Tag');
		query.andWhere('Release.repository = :id', repo);
		query.andWhere('Release.version IN (:versions)', { versions: sliced });
		query.orderBy(`Release.created_at`, params.sort_order.toUpperCase() as any);

		if (params.includeAttachments) {
			query.leftJoinAndSelect('Release.attachments', 'Attachment');
			query.leftJoinAndSelect('Attachment.asset', 'Asset');
		}

		if (params.includeDownloads) {
			query.addSelect(qb => (qb
				.select('COUNT(*) as count')
				.from(ReleaseDownload, 'ReleaseDownload')
				.andWhere('ReleaseDownload.release = Release.id')
				.andWhere('ReleaseDownload.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)')
				.andWhere('ReleaseDownload.date < CURDATE()')
			), 'Release_weekly_downloads');
		}

		let results: any;

		// Fetch releases for the current page
		// Skip when no versions are available (query will error otherwise)
		if (sliced.length > 0) {
			const { entities, raw } = await query.getRawAndEntities();
			results = entities.map((entity, index) => {
				const downloads = raw[index].Release_weekly_downloads;
				if (typeof downloads !== 'string') return instanceToPlain(entity);
				return {
					...instanceToPlain(entity),
					weekly_downloads: Number(downloads)
				};
			});
		}
		else {
			results = [];
		}

		// Sort releases to match the sliced array
		results.sort((a, b) => sliced.indexOf(a.version) - sliced.indexOf(b.version));

		return {
			pagination: {
				page: currentPage,
				page_count: numPages,
				page_size: currentPageSize,
				num_results: numResults
			},
			results
		};
	}

	/**
	 * Creates a new draft release.
	 *
	 * @param dto
	 */
	public async create(repo: Repository, dto: CreateReleaseDto) {
		// Validate the version string with the driver
		const version = repo.driver.validateVersionString(dto.version);

		// Check for a matching version name in the repository
		if (await this.getFromVersion(repo, version)) {
			throw new BadRequestException('The specified version already exists within the repository');
		}

		// Create the release
		const release = this.repository.create({
			version,
			status: ReleaseStatus.Draft,
			description: dto.description,
		});

		// Attach the repository
		release.repository = Promise.resolve(repo);

		// Resolve the tags
		// This will throw errors if the tag(s) don't exist, so we'll await it
		const tags = await Promise.all(
			dto.tags.map(tag => this.tags.getTag(repo, tag))
		);

		// Attach the tags
		release.tags = Promise.resolve(tags);

		// Save and return
		return this.repository.save(release);
	}

	/**
	 * Updates an existing release. This can also be used to publish it.
	 */
	public async update(repo: Repository, release: Release, dto: UpdateReleaseDto) {
		release.description = dto.description;

		// Handle publishing
		if (dto.status === ReleaseStatus.Published) {
			if (release.status === ReleaseStatus.Draft) {
				// Get the assets for both the repository and the release
				const repoAssets = await repo.assets;
				const attachments = await release.attachments;

				// Check if all required assets have an upload
				for (const repoAsset of repoAssets) {
					if (repoAsset.required) {
						const asset = attachments.find(asset => asset.asset.id === repoAsset.id);

						if (!asset) {
							throw new BadRequestException(
								`The ${repoAsset.name} attachment is required before this release can be published`
							);
						}
					}
				}

				// Make sure at least one attachment is uploaded
				if (attachments.length === 0) {
					throw new BadRequestException(
						`At least one attachment must be uploaded before this release can be published`
					);
				}

				release.status = ReleaseStatus.Published;
				release.published_at = new Date();
			}
			else if (release.status === ReleaseStatus.Archived) {
				throw new BadRequestException(
					`Cannot republish an archived release`
				);
			}
		}

		// Throw an error when attempting to unpublish
		else if (release.status !== ReleaseStatus.Draft && dto.status === ReleaseStatus.Draft) {
			throw new BadRequestException('Cannot revert a published release back into a draft');
		}

		// Resolve the tags
		// This will throw errors if the tag(s) don't exist, so we'll await it
		const tags = await Promise.all(
			dto.tags.map(tag => this.tags.getTag(repo, tag))
		);

		// Attach the tags
		release.tags = Promise.resolve(tags);

		// Save and return
		return this.repository.save(release);
	}

	/**
	 * Deletes a release. This can only be done while it is in a draft state.
	 */
	public async delete(release: Release) {
		if (release.status !== ReleaseStatus.Draft) {
			throw new BadRequestException('Cannot delete a release after it has been published');
		}

		return this.repository.delete({
			id: release.id
		});
	}

	/**
	 * Returns an array of all version strings available in this repository.
	 *
	 * @param repo
	 * @param status
	 * @returns
	 */
	public async getAllVersions(repo: Repository, status: 'all' | 'draft' | 'published' | 'archived' = 'published'): Promise<string[]> {
		const builder = this.repository.createQueryBuilder();

		builder.select(['Release.version as version']);
		builder.where('Release.repository_id = :id', repo);
		builder.orderBy('Release.id', 'DESC');

		if (status !== 'all') {
			builder.andWhere('Release.status = :status', { status });
		}

		const rows = await builder.getRawMany();
		const versions = rows.map(row => row.version);

		return versions;
	}

	/**
	 * Returns an array of all version strings in a repository whose releases pass through the given filters.
	 *
	 * @param repo
	 * @param params
	 * @param collab
	 * @returns
	 */
	public async getFilteredVersions(repo: Repository, params: ReleaseFilterParams, collab?: Collaboration) {
		let statuses = [];

		if (params.status === 'all') statuses.push('draft', 'published', 'archived');
		else statuses.push(params.status);

		// Require relevant scopes to view draft releases
		if (!collab || !collab.hasPermission('repo.releases.create') || !collab.hasPermission('repo.releases.attachments.manage')) {
			statuses = statuses.filter(status => status !== 'draft');
		}

		const releases = await this.repository.find({
			select: ['version'],
			where: {
				repository: { id: repo.id },
				tags: params.tags.length > 0 ? { name: In(params.tags) } : undefined,
				attachments: params.assets.length === 0 ? undefined : {
					asset: { name: In(params.assets) }
				},
				status: In(statuses)
			},
			order: { id: params.sort_order }
		});

		return releases.map(release => release.version);
	}

	/**
	 * Increments the download count on the given release.
	 *
	 * @param release
	 * @returns
	 */
	public async recordDownload(release: Release) {
		return this.repository.update(release.id, {
			download_count: () => 'download_count + 1'
		});
	}

}

export interface ReleaseFilterParams {
	tags: string[];
	assets: string[];
	status: 'draft' | 'published' | 'archived' | 'all';
	sort_order: 'desc' | 'asc';
}

export interface ReleaseSearchParams extends ReleaseFilterParams {
	page: number;
	count: number;
	includeAttachments: boolean;
	includeDownloads: boolean;
	constraint?: string;
	sort: 'version' | 'date';
	sort_order: 'desc' | 'asc';
}
