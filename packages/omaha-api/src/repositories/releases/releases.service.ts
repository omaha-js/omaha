import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Release } from 'src/entities/Release';
import { Repository } from 'src/entities/Repository';
import { CreateReleaseDto } from './dto/CreateReleaseDto';
import { EntityManager, In, IsNull, Repository as TypeOrmRepository } from 'typeorm';
import { TagsService } from '../tags/tags.service';
import { UpdateReleaseDto } from './dto/UpdateReleaseDto';
import { ReleaseDownload } from 'src/entities/ReleaseDownload';
import { instanceToPlain } from 'class-transformer';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';
import { Collaboration } from 'src/entities/Collaboration';
import { VersionList } from 'src/drivers/interfaces/VersionSchemeDriver';
import { RepositorySettingsManager } from '../settings/RepositorySettingsManager';
import { Cron } from '@nestjs/schedule';
import { StorageService } from 'src/storage/storage.service';
import { RealtimeService } from 'src/realtime/realtime.service';
import prettyBytes from 'pretty-bytes';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { EmailService } from 'src/email/email.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { getAppLink } from 'src/support/utilities/links';
import { FunctionQueue } from '@baileyherbert/queue';

const AllStatuses = [ReleaseStatus.Draft, ReleaseStatus.Published, ReleaseStatus.Archived];

@Injectable()
export class ReleasesService {

	private logger = new Logger('ReleasesService');

	public constructor(
		@InjectRepository(Release) private readonly repository: TypeOrmRepository<Release>,
		private readonly tags: TagsService,
		private readonly storage: StorageService,
		private readonly email: EmailService,
		private readonly notifications: NotificationsService,
		private readonly ws: RealtimeService,
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
		if (typeof params.constraint === 'string' && tags.includes(params.constraint?.toLowerCase().trim())) {
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
				if (typeof downloads !== 'string') return instanceToPlain(entity, {
					excludePrefixes: ['_']
				});
				return {
					...instanceToPlain(entity, { excludePrefixes: ['_'] }),
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
	 * Returns the latest release for all repositories in the given array.
	 *
	 * @param targets
	 * @returns
	 */
	public async getLatestReleaseForMany(targets: Repository[]) {
		const queue = new FunctionQueue({ maxConcurrentTasks: 3, useAsyncTicking: false });
		const releases: Record<string, Release | undefined> = {};

		for (const target of targets) {
			releases[target.id] = undefined;

			queue.push(async () => {
				const versions = await this.getAllVersions(target, [ReleaseStatus.Published]);

				if (versions.length > 0) {
					const sorted = target.driver.getVersionsSorted({ all: versions, selected: versions }, 'desc');
					const latestVersion = sorted[0];
					const latestRelease = await this.getFromVersionOrFail(target, latestVersion);

					releases[target.id] = latestRelease;
				}
			});
		}

		await queue.getCompletionPromise();
		return releases;
	}

	/**
	 * Creates a new draft release.
	 *
	 * @param dto
	 */
	public async create(repo: Repository, dto: CreateReleaseDto, ip: string) {
		// Validate the version string with the driver and look for an existing release
		const version = repo.driver.validateVersionString(dto.version);
		const existing = await this.getFromVersion(repo, version);

		// Check for a matching version name in the repository
		if (existing) {
			// If the matched version is a draft, treat this request as an update
			if (existing.status === ReleaseStatus.Draft) {
				return this.update(repo, existing, dto, ip);
			}

			throw new BadRequestException('The specified version already exists within the repository');
		}

		// Check for violations of rolling release rules
		if (RepositorySettingsManager.get(repo.settings, 'releases.rolling')) {
			const versions = await this.getAllVersions(repo, [ReleaseStatus.Published, ReleaseStatus.Archived]);
			const drafts = await this.getAllVersions(repo, [ReleaseStatus.Draft]);

			// Find all versions within the same major family
			const sameMajorVersions = repo.driver.getVersionsFromSameMajor({ all: versions, selected: versions }, version);
			const sortedSameMajor = repo.driver.getVersionsSorted({
				all: [...sameMajorVersions, version],
				selected: [...sameMajorVersions, version]
			}, 'desc');

			// Ensure the new version is the greatest in its family
			if (sortedSameMajor[0] !== version) {
				throw new BadRequestException(
					`New version (${version}) must be greater than the prior release (${sortedSameMajor[0]})`
				);
			}

			// Ensure there are no other drafts in the same family
			const sameMajorDrafts = repo.driver.getVersionsFromSameMajor({ all: drafts, selected: drafts }, version);
			if (sameMajorDrafts.length > 0) {
				throw new BadRequestException(
					`A draft release (${sameMajorDrafts[0]}) already exists for the same major version`
				);
			}
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

		// Save entity
		await this.repository.save(release);

		// Emit ws event
		this.ws.emit(repo, 'release_created', { release }, [
			'repo.releases.create',
			'repo.releases.attachments.manage'
		]);

		return release;
	}

	/**
	 * Updates an existing release. This can also be used to publish it.
	 */
	public async update(repo: Repository, release: Release, dto: UpdateReleaseDto, ip: string) {
		if (typeof dto.description === 'string') {
			release.description = dto.description;
		}

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

		// Update tags
		if (dto.tags && dto.tags.length > 0) {
			// This will throw errors if the tag(s) don't exist, so we'll await it
			const tags = await Promise.all(
				dto.tags.map(tag => this.tags.getTag(repo, tag))
			);

			// Attach the tags
			release.tags = Promise.resolve(tags);
		}

		// Save the entity
		// Wrap in a transaction for rolling logic
		await this.repository.manager.transaction(async manager => {
			if (published && RepositorySettingsManager.get(repo.settings, 'releases.rolling')) {
				await this.internRollReleases(repo, release, manager);
			}

			return manager.save(release);
		});

		// Emit the updated event
		if (release.status === ReleaseStatus.Draft) {
			this.ws.emit(repo, 'release_updated', { release }, [
				'repo.releases.create',
				'repo.releases.attachments.manage'
			]);
		}
		else {
			this.ws.emit(repo, 'release_updated', { release });
		}

		// Emit the published event and send notifications
		if (published) {
			await this.notifications.sendForRepo(repo, 'repo_release_published', {
				release,
				remoteAddress: ip
			});

			this.ws.emit(repo, 'release_published', { release });
			await this.ws.emitNewRelease(repo, release);
		}

		return release;
	}

	/**
	 * Deletes a release. This can only be done while it is in a draft state.
	 */
	public async delete(release: Release) {
		if (release.status !== ReleaseStatus.Draft) {
			throw new BadRequestException('Cannot delete a release after it has been published');
		}

		const repo = await release.repository;
		await this.repository.delete({
			id: release.id
		});

		this.ws.emit(repo, 'release_deleted', { release }, [
			'repo.releases.create',
			'repo.releases.attachments.manage'
		]);

		return;
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
	 * Increments the download count on the given release without bumping the update timestamp.
	 *
	 * @param release
	 * @returns
	 */
	public async recordDownload(release: Release) {
		return this.repository.update(release.id, {
			download_count: () => 'download_count + 1',
			updated_at: () => 'updated_at'
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

	@Cron('0 0 * * * *')
	protected async onMaintenanceRun() {
		const releases = await this.repository.find({
			where: {
				status: ReleaseStatus.Archived,
				purged_at: IsNull()
			},
			relations: {
				repository: true
			}
		});

		let totalFilesFreed = 0;
		let totalBytesFreed = 0;

		for (const release of releases) {
			const repository = await release.repository;
			const expirationDays = RepositorySettingsManager.get(repository.settings, 'releases.archives.expiration');
			const expiration = release.archived_at!.getTime() + (expirationDays * 86400000);

			if (expiration <= Date.now()) {
				this.logger.log(`Purging expired attachments for release ${release.id} in ${repository.id}`);

				for (const attachment of await release.attachments) {
					if (attachment.object_name) {
						await this.storage.delete(this.storage.getObjectName(repository, attachment.object_name));

						totalFilesFreed++;
						totalBytesFreed += attachment.size;
					}
				}

				release.purged_at = new Date();
				await this.repository.save(release);
			}
		}

		if (totalFilesFreed > 0) {
			this.logger.log(`Cleared ${totalFilesFreed} objects for a total of ${prettyBytes(totalBytesFreed)}`);
		}
	}

	/**
	 * Rolls a repository to automatically archive any releases outside the configured retention. Returns an array of
	 * affected version strings.
	 *
	 * @param repo
	 * @param release
	 * @param manager
	 * @returns
	 */
	public async internRollReleases(repo: Repository, release: Release, manager: EntityManager) {
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
			query.andWhere('repository = :id', repo);

			await query.execute();

			// Return targets
			return [...targets];
		}

		return [];
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
