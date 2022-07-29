import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Patch, Post, UseGuards } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { BaseToken } from 'src/auth/tokens/models/BaseToken';
import { Collaboration } from 'src/entities/Collaboration';
import { Repository } from 'src/entities/Repository';
import { Collab } from 'src/support/Collab';
import { Repo } from 'src/support/Repo';
import { User } from 'src/support/User';
import { CollaboratorRole } from './collaborations/collaborations.types';
import { CreateRepoDto } from './dto/CreateRepoDto';
import { UpdateRepoDto } from './dto/UpdateRepoDto';
import { RepositoriesGuard } from './repositories.guard';
import { RepositoriesService } from './repositories.service';

@Controller('repositories')
export class RepositoriesController {

	public constructor(
		private readonly service: RepositoriesService
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
			...repo,
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
	public async deleteRepository(@Repo() repo: Repository, @Collab() collab?: Collaboration) {
		if (collab?.role !== CollaboratorRole.Owner) {
			throw new ForbiddenException('Insufficient privileges');
		}

		return {
			success: true,
			message: 'Repository has been deleted successfully.'
		};
	}

}
