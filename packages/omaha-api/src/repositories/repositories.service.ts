import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'src/entities/Repository';
import { CreateRepoDto } from './dto/CreateRepoDto';
import { RepositoryAccessType } from '../entities/enum/RepositoryAccessType';
import { IsNull, Not, Repository as TypeOrmRepository } from 'typeorm';
import { Account } from 'src/entities/Account';
import { CollaborationsService } from './collaborations/collaborations.service';
import { CollaborationRole } from '../entities/enum/CollaborationRole';
import { instanceToPlain } from 'class-transformer';
import { UpdateRepoDto } from './dto/UpdateRepoDto';
import { TagsService } from './tags/tags.service';
import { AssetsService } from './assets/assets.service';
import { ReleasesService } from './releases/releases.service';
import { RepositorySettingsManager } from './settings/RepositorySettingsManager';
import { EmailService } from 'src/email/email.service';
import { Environment } from 'src/app.environment';
import { Cron } from '@nestjs/schedule';
import { AttachmentsService } from './releases/attachments/attachments.service';
import { ReleaseAttachmentStatus } from 'src/entities/enum/ReleaseAttachmentStatus';
import { StorageService } from 'src/storage/storage.service';
import { ObjectNotFoundError } from 'src/storage/errors/ObjectNotFoundError';
import moment from 'moment';
import prettyBytes from 'pretty-bytes';
import { Collaboration } from 'src/entities/Collaboration';

@Injectable()
export class RepositoriesService {

	private readonly logger = new Logger('RepositoriesService');

	public constructor(
		@InjectRepository(Repository) private readonly repository: TypeOrmRepository<Repository>,
		private readonly collaborations: CollaborationsService,
		private readonly tags: TagsService,
		private readonly assets: AssetsService,
		private readonly releases: ReleasesService,
		private readonly email: EmailService,
		private readonly attachments: AttachmentsService,
		private readonly storage: StorageService
	) {}

	/**
	 * Returns the repositories that the given account has access to.
	 *
	 * @param account
	 * @returns
	 */
	public async getRepositoriesForAccount(account: Account): Promise<Repository[]> {
		const results = new Array<any>();
		const collabs = await this.collaborations.getForAccount(account);

		for (const collab of collabs) {
			const repo = await collab.repository;

			if (repo) {
				results.push({
					...instanceToPlain(repo),
					collaboration: instanceToPlain(collab)
				});
			}
		}

		return results;
	}

	/**
	 * Creates a new repository.
	 *
	 * @param dto
	 * @param account The account to mark as the owner for this repository.
	 * @returns
	 */
	public async createRepository(dto: CreateRepoDto, account: Account) {
		const name = dto.name;
		const description = dto.description;
		const scheme = dto.scheme;
		const access = dto.access;

		// Create the repository
		const repository = await this.repository.save(this.repository.create({
			name,
			description,
			scheme,
			access,
			settings: {}
		}));

		// Create the first collaboration with an ownership role
		const collaboration = await this.collaborations.create(
			repository,
			account,
			CollaborationRole.Owner
		);

		// Create the default tag
		await this.tags.createTag(repository, {
			name: 'latest',
			description: 'The latest stable release.'
		});

		// Create the default asset
		await this.assets.createAsset(repository, {
			name: 'main',
			description: 'The packaged files for the release.',
			required: true,
		});

		return {
			repository,
			collaboration
		}
	}

	/**
	 * Updates the given repository with the specified changes.
	 *
	 * @param repository
	 * @param changes
	 * @returns
	 */
	public async updateRepository(repository: Repository, changes: UpdateRepoDto) {
		if (typeof changes.name === 'string') {
			repository.name = changes.name;
		}

		if (typeof changes.description === 'string' && repository.description !== changes.description) {
			repository.description = changes.description;
		}

		if (typeof changes.scheme === 'string' && repository.scheme !== changes.scheme) {
			if ((await this.releases.getAllVersions(repository)).length > 0) {
				throw new BadRequestException(
					'Cannot change the version scheme of a repository with one or more releases'
				);
			}

			repository.scheme = changes.scheme;
		}

		if (typeof changes.access === 'string' && repository.access !== changes.access) {
			repository.access = changes.access;
		}

		if (typeof changes.settings === 'object') {
			repository.settings = {
				...repository.settings,
				...RepositorySettingsManager.sanitize(changes.settings)
			};
		}

		return this.repository.save(repository);
	}

	/**
	 * Fetches a repository from its identifier.
	 *
	 * @param id
	 * @returns
	 */
	public async getRepository(id: string) {
		return this.repository.findOneOrFail({
			where: {
				id
			}
		})
	}

	/**
	 * Schedules the given repository for deletion.
	 *
	 * @param repository The repository to delete.
	 * @param account The account that requested the deletion.
	 */
	public async scheduleDeletion(repository: Repository, account: Account) {
		const collaborators = await this.collaborations.getForRepository(repository);
		const owners = collaborators.filter(collab => collab.role === CollaborationRole.Owner)
		const accounts = await Promise.all(owners.map(collab => collab.account));
		const to = accounts.map(account => account.email);

		// Soft delete the repository
		await this.repository.softDelete(repository.id);

		// Calculate the date for real deletion
		const date = moment().add(7, 'day').format('YYYY-MM-DD');

		// Build the restoration link
		const url = new URL(`restore/repository/${repository.id}`, Environment.APP_URL);

		// Send emails to owners
		accounts.map(account => this.email.send({
			subject: 'Repository scheduled for deletion',
			template: 'repo_deletion_scheduled',
			to,
			context: {
				name: account.name,
				repository,
				account,
				link: url.href,
				date
			}
		}));

		return {
			success: true,
			message: 'Repository has been scheduled for deletion.'
		};
	}

	/**
	 * Restores a deleted repository from its identifier.
	 *
	 * @param id
	 * @returns
	 */
	public async restoreRepository(id: string) {
		return this.repository.update(id, {
			deleted_at: null
		});
	}

	/**
	 * Fetches a deleted repository from its identifier.
	 *
	 * @param id
	 * @returns
	 */
	public async getDeletedRepository(id: string) {
		return this.repository.findOneOrFail({
			withDeleted: true,
			where: {
				id,
				deleted_at: Not(IsNull())
			}
		});
	}

	private async getDeletedRepositoriesForCleaning() {
		const query = this.repository.createQueryBuilder();
		query.andWhere('deleted_at <= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
		query.withDeleted();

		return query.getMany();
	}

	@Cron('0 0 * * * *')
	protected async onMaintenanceRun() {
		const repositories = await this.getDeletedRepositoriesForCleaning();

		for (const repo of repositories) {
			if (!repo.deleted_at) {
				throw new Error('Got a non-deleted repository in the cleanup run -- this should never happen!');
			}

			const attachments = await this.attachments.getAllForRepository(repo);
			this.logger.log('Cleaning %d attachments for deleted repository %s', attachments.length, repo.id);

			let size = 0;
			let failed = false;

			for (const attachment of attachments) {
				if (!attachment.object_name) {
					continue;
				}

				const objectName = this.storage.getObjectName(repo, attachment.object_name);

				try {
					if (attachment.status === ReleaseAttachmentStatus.Ready) {
						this.logger.debug('Deleting storage object %s (%d bytes)', objectName, attachment.size);
						await this.storage.delete(objectName);
						size += attachment.size;
					}
				}
				catch (error) {
					if (!(error instanceof ObjectNotFoundError)) {
						this.logger.error('Error when deleting object %s:', objectName, error);
						failed = true;
						break;
					}
				}
			}

			if (failed) {
				this.logger.error('Halting further clean-up due to error');
				return;
			}

			await this.repository.delete(repo.id);
			this.logger.log('Finished deletion of repository %s (freed %s)', repo.id, prettyBytes(size));
		}
	}

}

export interface RepositoryWithCollab extends Repository {
	collaboration: Collaboration;
}
