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
import { VersionList } from 'src/drivers/interfaces/VersionSchemeDriver';
import { RepositorySettingsManager } from '../settings/RepositorySettingsManager';

const AllStatuses = [ReleaseStatus.Draft, ReleaseStatus.Published, ReleaseStatus.Archived];

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
		if (params.statuses.length === 0) {
			params.statuses = AllStatuses;
		}

		// Get all available tag names
		const tags = await this.tags.getAllTags(repo);

		// Allow constraints to be set to a tag name
		if (tags.includes(params.constraint?.toLowerCase().trim())) {
			params.tags = [params.constraint.toLowerCase().trim()];
			params.constraint = undefined;
		};

		// Narrow down all version numbers matching our criteria
		const versions = await this.getVersionListForCollaboration(repo, collaboration, params);
		const selected = [...versions.selected];

		// Narrow them down further with the version constraint and sort using the driver
		const filtered = this.getVersionsFromConstraint(repo, versions, params.constraint ?? '*');
		const sorted = params.sort === 'version' ?
			repo.driver.getVersionsSorted({ all: versions.all, selected: filtered }, params.sort_order) : filtered;

		// Sort by date by matching the original selection order
		if (params.sort === 'date') {
			sorted.sort((a, b) => selected.indexOf(a) - selected.indexOf(b));
		}

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
		let published = false;
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
				published = true;
			}
			else if (release.status === ReleaseStatus.Archived) {
				throw new BadRequestException(
					`Cannot republish an archived release`
				);
			}
		}

		else if (dto.status === ReleaseStatus.Archived && release.status !== ReleaseStatus.Archived) {
			if (release.status !== ReleaseStatus.Published) {
				throw new BadRequestException('Only published releases can be archived');
			}

			release.status = ReleaseStatus.Archived;
			release.archived_at = new Date();
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
		// Wrap in a transaction for rolling logic
		return this.repository.manager.transaction(async manager => {
			if (published && RepositorySettingsManager.get(repo.settings, 'releases.rolling')) {
				const buffer = RepositorySettingsManager.get(repo.settings, 'releases.rolling.buffer') - 1;
				const versions = await this.getAllVersions(repo, [ReleaseStatus.Published]);
				const tags = await this.tags.getAllTags(repo);

				// Get all versions in the same major version as a set
				const targets = new Set(repo.driver.getVersionsFromSameMajor(
					{ all: versions, selected: versions },
					release.version
				));

				// Iterate over all tags
				for (const tagName of tags) {
					// Get all releases within the tag
					const tagVersions = await this.getVersionsFromFilters(repo, {
						assets: [],
						tags: [tagName],
						statuses: [ReleaseStatus.Published],
						sort_order: 'asc'
					});

					// Get all releases in the same major version
					const selected = repo.driver.getVersionsFromSameMajor(
						{ all: versions, selected: tagVersions},
						release.version
					);

					// Sort the releases in descending order
					const sorted = repo.driver.getVersionsSorted({ all: versions, selected }, 'desc');

					// Delete all releases within the buffer from our targets
					for (const version of sorted.slice(0, buffer)) {
						targets.delete(version);
					}
				}

				// Update all remaining release targets to the 'archived' status
				if (targets.size > 0) {
					const query = manager.createQueryBuilder().update(Release, {
						archived_at: () => 'CURRENT_TIMESTAMP',
						updated_at: () => '`updated_at`',
						status: ReleaseStatus.Archived
					});

					query.where('version IN (:versions)', { versions: [...targets] });
					await query.execute();
				}
			}

			return manager.save(release);
		});
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
	 * Returns an array of all version strings available in this repository from the perspective of the given
	 * collaborator.
	 *
	 * @param repo
	 * @param collab
	 * @param statuses
	 * @returns
	 */
	public async getAllVersionsForCollaboration(repo: Repository, collab?: Collaboration, statuses: ReleaseStatus[] = AllStatuses) {
		return this.getAllVersions(repo, this.getFilteredStatuses(statuses, collab));
	}

	/**
	 * Returns an array of all version strings available in this repository.
	 *
	 * @param repo
	 * @param statuses
	 * @returns
	 */
	public async getAllVersions(repo: Repository, statuses: ReleaseStatus[] = AllStatuses): Promise<string[]> {
		const builder = this.repository.createQueryBuilder();

		builder.select(['Release.id as id', 'Release.version as version']);
		builder.where('Release.repository_id = :id', repo);
		builder.orderBy('Release.id', 'ASC');
		builder.andWhere('Release.status IN (:statuses)', { statuses });

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
	public async getVersionListForCollaboration(repo: Repository, collab: Collaboration | undefined, params: ReleaseFilterParams) {
		return this.getVersionList(repo, {
			...params,
			statuses: this.getFilteredStatuses(params.statuses, collab),
		});
	}

	/**
	 * Returns an object containing all releases for the given repository, as well as releases that match the given
	 * filters. This is primarily useful when working with version scheme drivers.
	 *
	 * @param repo
	 * @param params
	 * @returns
	 */
	public async getVersionList(repo: Repository, params: ReleaseFilterParams): Promise<VersionList> {
		const [all, selected] = await Promise.all([
			this.getAllVersions(repo, params.statuses),
			this.getVersionsFromFilters(repo, params)
		]);

		return { all, selected };
	}

	/**
	 * Returns an array of all version strings in a repository whose releases pass through the given filters.
	 *
	 * @param repo
	 * @param params
	 * @returns
	 */
	public async getVersionsFromFilters(repo: Repository, params: ReleaseFilterParams) {
		return this.repository.find({
			select: ['version'],
			where: {
				repository: { id: repo.id },
				tags: params.tags.length > 0 ? { name: In(params.tags) } : undefined,
				attachments: params.assets.length === 0 ? undefined : {
					asset: { name: In(params.assets) }
				},
				status: In(params.statuses)
			},
			order: {
				created_at: params.sort_order
			}
		}).then(releases => releases.map(release => release.version));
	}

	/**
	 * Filters the given array of statuses for a collaboration, removing the `draft` status unless permission is
	 * explicitly granted. Returns a new array.
	 *
	 * @param statuses
	 * @param collab
	 * @returns
	 */
	private getFilteredStatuses(statuses: ReleaseStatus[], collab?: Collaboration) {
		// Require relevant scopes to view draft releases
		if (!collab || (!collab.hasPermission('repo.releases.create') && !collab.hasPermission('repo.releases.attachments.manage'))) {
			statuses = statuses.filter(status => status !== ReleaseStatus.Draft);
		}

		return statuses;
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

	/**
	 * Returns a filtered list of versions (in no particular order) from the given repository's driver based on a
	 * string constraint.
	 *
	 * @param repo
	 * @param versions
	 * @param constraint
	 * @returns
	 */
	public getVersionsFromConstraint(repo: Repository, versions: VersionList, constraint: string) {
		constraint = constraint.trim();

		if (constraint === '*') {
			return versions.selected;
		}

		return repo.driver.getVersionsFromConstraint(versions, constraint);
	}

}

export interface ReleaseFilterParams {
	tags: string[];
	assets: string[];
	statuses: ReleaseStatus[];
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
