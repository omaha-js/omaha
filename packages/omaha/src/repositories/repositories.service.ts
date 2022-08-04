import { Injectable } from '@nestjs/common';
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

@Injectable()
export class RepositoriesService {

	public constructor(
		@InjectRepository(Repository) private readonly repository: TypeOrmRepository<Repository>,
		private readonly collaborations: CollaborationsService,
		private readonly tags: TagsService,
		private readonly assets: AssetsService,
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

		if (typeof changes.description === 'string') {
			repository.description = changes.description;
		}

		if (typeof changes.scheme === 'string') {
			repository.scheme = changes.scheme;
		}

		if (typeof changes.access === 'string') {
			repository.access = changes.access;
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
