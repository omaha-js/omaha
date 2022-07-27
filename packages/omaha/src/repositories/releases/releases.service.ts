import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Release } from 'src/entities/Release';
import { Repository } from 'src/entities/Repository';
import { CreateReleaseDto } from './dto/CreateReleaseDto';
import { Repository as TypeOrmRepository } from 'typeorm';
import { TagsService } from '../tags/tags.service';
import { UpdateReleaseDto } from './dto/UpdateReleaseDto';

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
	 * Searches for assets.
	 */
	public async search(repo: Repository, params: ReleaseSearchParams) {
		const builder = this.repository.createQueryBuilder();
		const tags = await this.tags.getAllTags(repo);

		// Get all available version strings
		const versions = await this.getAllVersions(repo, params.status);

		// Repository scope
		builder.andWhere('Release.repository_id = :id', repo);

		// Artificial limiter when assets are enabled
		if (params.includeAttachments) {
			if (params.count === 0 || params.count > 100) {
				params.count = 100;
			}
		}

		// Count & page
		if (params.count > 0) {
			builder.limit(params.count);
			builder.offset((params.page * params.count) - params.count);
		}

		// Join tags
		builder.leftJoinAndSelect('Release.tags', 'Tag');

		// Join attachments if enabled
		if (params.includeAttachments) {
			builder.leftJoinAndSelect('Release.attachments', 'ReleaseAttachment');
			builder.leftJoinAndSelect('ReleaseAttachment.asset', 'Asset');
		}

		// Include from tags array
		if (params.tags.length > 0) {
			builder.andWhere('Tag.name IN (:tags)', {
				tags: params.tags
			});
		}

		// Include from attachments array
		if (params.assets.length > 0) {
			builder.andWhere('Asset.name IN (:assets)', {
				assets: params.assets
			});
		}

		// Draft status
		if (params.status !== 'all') {
			builder.andWhere('Release.draft = :draft', {
				draft: params.status === 'draft' ? 1 : 0
			});
		}

		// Constraint
		if (params.constraint) {
			// Implement tag constraint
			if (tags.includes(params.constraint.toLowerCase())) {
				builder.andWhere('Tag.name = :tag', {
					tag: params.constraint.toLowerCase()
				});
			}

			// Implement the constraint using the driver
			else {
				// Filter them using the driver
				const filtered = repo.driver.getVersionsFromConstraint(versions, params.constraint);

				// Apply the filter to the query
				builder.andWhere('Release.version IN (:filtered)', { filtered });
			}
		}

		// Sort by version (using driver)
		if (params.sort === 'version') {
			// Request sort order from driver
			const sorted = repo.driver.getVersionsSorted(versions, params.sort_order);

			builder.orderBy(`FIELD (Release.version, :sort_versions)`);
			builder.setParameter('sort_versions', sorted);
		}

		// Sort by date
		else if (params.sort === 'date') {
			builder.orderBy('Release.published_at', params.sort_order.toUpperCase() as 'ASC' | 'DESC');
		}

		return {
			releases: await builder.getMany()
		};
	}

	/**
	 * Creates a new draft release.
	 *
	 * @param dto
	 */
	public async create(repo: Repository, dto: CreateReleaseDto) {
		// Check for a matching version name in the repository
		if (await this.getFromVersion(repo, dto.version)) {
			throw new BadRequestException('The specified version already exists within the repository');
		}

		// Validate the version string with the driver
		const version = repo.driver.validateVersionString(dto.version);

		// Create the release
		const release = this.repository.create({
			version,
			draft: true,
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

		// Check if the update is eligible for publishing when setting draft=false
		if (release.draft && dto.draft === false) {
			// Get the assets for both the repository and the release
			const repoAssets = await repo.assets;
			const ReleaseAttachments = await release.attachments;

			// Check if all required assets have an upload
			for (const repoAsset of repoAssets) {
				if (repoAsset.required) {
					const asset = ReleaseAttachments.find(asset => asset.asset.id === repoAsset.id);

					if (!asset) {
						throw new BadRequestException(`The ${repoAsset.name} asset is required before publishing`);
					}
				}
			}

			release.draft = false;
			release.published_at = new Date();
		}

		// Throw an error when attempting to unpublish
		else if (!release.draft && dto.draft) {
			throw new BadRequestException('Cannot change the draft status of a published release');
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
		if (!release.draft) {
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
	public async getAllVersions(repo: Repository, status: 'all' | 'draft' | 'published' = 'published'): Promise<string[]> {
		const builder = this.repository.createQueryBuilder();

		builder.select(['Release.version as version']);
		builder.where('Release.repository_id = :id', repo);

		if (status !== 'all') {
			builder.andWhere('Release.draft = :draft', {
				draft: status === 'draft' ? 1 : 0
			});
		}

		const rows = await builder.getRawMany();
		const versions = rows.map(row => row.version);

		return versions;
	}

}


export interface ReleaseSearchParams {
	page: number;
	count: number;
	includeAttachments: boolean;
	constraint: string | undefined;
	tags: string[];
	assets: string[];
	sort: 'version' | 'date';
	sort_order: 'desc' | 'asc';
	status: 'draft' | 'published' | 'all';
}
