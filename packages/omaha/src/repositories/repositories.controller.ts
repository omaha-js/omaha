import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { BaseToken } from 'src/auth/tokens/models/BaseToken';
import { Collaboration } from 'src/entities/Collaboration';
import { Repository } from 'src/entities/Repository';
import { Collab } from 'src/support/Collab';
import { Repo } from 'src/support/Repo';
import { User } from 'src/support/User';
import { CollaborationRole } from '../entities/enum/CollaborationRole';
import { CollaborationsService } from './collaborations/collaborations.service';
import { CreateRepoDto } from './dto/CreateRepoDto';
import { UpdateRepoDto } from './dto/UpdateRepoDto';
import { ReleasesService } from './releases/releases.service';
import { RepositoriesGuard } from './repositories.guard';
import { RepositoriesService } from './repositories.service';

@Controller('repositories')
export class RepositoriesController {

	public constructor(
		private readonly service: RepositoriesService,
		private readonly releases: ReleasesService,
		private readonly collaborations: CollaborationsService,
	) {}

	/**
	 * Lists all repositories that the requester has access to.
	 *
	 * @param token
	 * @returns
	 */
	@Get()
	public getRepositoryList(@User() token: BaseToken) {
		if (token.isForAccount()) {
			return this.service.getRepositoriesForAccount(token.account);
		}
		else if (token.isForRepository()) {
			return [token.repository];
		}

		throw new NotFoundException();
	}

	@Post()
	@UseScopes('account.repos.manage')
	public async createRepository(@Body() dto: CreateRepoDto, @User() token: AccountToken) {
		const result = await this.service.createRepository(dto, token.account);

		return {
			...instanceToPlain(result.repository),
			collaboration: { ...instanceToPlain(result.collaboration), id: undefined }
		};
	}

	@Get(':repo_id')
	@UseGuards(RepositoriesGuard)
	public async getRepository(@Repo() repo: Repository) {
		return {
			...instanceToPlain(repo),
			tags: await repo.tags,
			assets: await repo.assets,
		};
	}

	@Patch(':repo_id')
	@UseScopes('repo.manage')
	@UseGuards(RepositoriesGuard)
	public async updateRepository(@Repo() repo: Repository, @Body() dto: UpdateRepoDto) {
		return await this.service.updateRepository(repo, dto);
	}

	@Delete(':repo_id')
	@UseGuards(RepositoriesGuard)
	public async deleteRepository(@Repo() repo: Repository, @User() token: BaseToken, @Collab() collab?: Collaboration) {
		if (collab?.role !== CollaborationRole.Owner) {
			throw new ForbiddenException('Insufficient privileges');
		}

		if (!token || !token.isForAccount()) {
			throw new ForbiddenException('You cannot delete repositories with your current mode of authentication');
		}

		if (!token.hasPermission('account.repos.manage')) {
			throw new ForbiddenException('You do not have access to the requested repository');
		}

		return this.service.scheduleDeletion(repo, token.account);
	}

	@Patch('restore/:repo_id')
	public async restoreRepository(@Param('repo_id') id: string, @User() token: BaseToken) {
		const repo = await this.service.getDeletedRepository(id);

		if ((!token || !token.isForAccount()) || token.isDatabaseToken()) {
			throw new BadRequestException('Deleted repositories can only be restored from a web session');
		}

		const collabs = await repo.collaborators;

		for (const collab of collabs) {
			const account = await collab.account;

			if (account.id === token.account.id) {
				if (collab.role === CollaborationRole.Owner) {
					await this.service.restoreRepository(id);

					return {
						success: true,
						message: 'Repository has been restored successfully'
					}
				}

				break;
			}
		}

		throw new ForbiddenException('You do not have permission to perform this operation');
	}

	/**
	 * Lists all published version strings for the repository. These version strings are sorted by the driver in
	 * descending order (highest version first).
	 *
	 * @param repo
	 * @param collab
	 * @returns
	 */
	@Get(':repo_id/versions')
	@UseGuards(RepositoriesGuard)
	public async getAllVersions(@Repo() repo: Repository, @Collab() collab: Collaboration) {
		const all = await this.releases.getAllVersionsForCollaboration(repo, collab);
		const versions = repo.driver.getVersionsSorted(
			{ all, selected: all },
			'desc'
		);

		return { versions };
	}

}
