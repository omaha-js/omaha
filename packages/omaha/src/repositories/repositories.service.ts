import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'src/entities/Repository';
import { CreateRepoDto } from './dto/CreateRepoDto';
import { RepositoryAccessType } from '../entities/enum/RepositoryAccessType';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Account } from 'src/entities/Account';
import { CollaborationsService } from './collaborations/collaborations.service';
import { CollaborationRole } from '../entities/enum/CollaborationRole';
import { instanceToPlain } from 'class-transformer';
import { UpdateRepoDto } from './dto/UpdateRepoDto';
import { TagsService } from './tags/tags.service';
import { AssetsService } from './assets/assets.service';
import { ReleasesService } from './releases/releases.service';
import { RepositorySettingsManager } from './settings/RepositorySettingsManager';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';

@Injectable()
export class RepositoriesService {

	public constructor(
		@InjectRepository(Repository) private readonly repository: TypeOrmRepository<Repository>,
		private readonly collaborations: CollaborationsService,
		private readonly tags: TagsService,
		private readonly assets: AssetsService,
		private readonly releases: ReleasesService,
	) {}

	/**
	 * Returns the repositories that the given account has access to.
	 *
	 * @param account
	 * @returns
	 */
	public async getRepositoriesForAccount(account: Account): Promise<Repository[]> {
		const results = [];
		const collabs = await this.collaborations.getForAccount(account);

		for (const collab of collabs) {
			results.push({
				...instanceToPlain(await collab.repository),
				collaboration: instanceToPlain(collab)
			});
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
		const description = dto.description ?? '';
		const scheme = dto.scheme;
		const access = dto.access ?? RepositoryAccessType.Private;

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

}
