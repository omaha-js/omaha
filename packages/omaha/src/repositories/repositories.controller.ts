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
import { CollaborationRole } from '../entities/enum/CollaborationRole';
import { CreateRepoDto } from './dto/CreateRepoDto';
import { UpdateRepoDto } from './dto/UpdateRepoDto';
import { ReleasesService } from './releases/releases.service';
import { RepositoriesGuard } from './repositories.guard';
import { RepositoriesService } from './repositories.service';

@Controller('repositories')
export class RepositoriesController {

	public constructor(
		private readonly service: RepositoriesService,
		private readonly releases: ReleasesService
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
		if (collab?.role !== CollaborationRole.Owner) {
			throw new ForbiddenException('Insufficient privileges');
		}

		return {
			success: true,
			message: 'Repository has been deleted successfully.'
		};
	}

	/**
	 * Lists all published version strings for the repository. These version strings are sorted by the driver in
	 * descending order (highest version first).
	 *
	 * @param repo
	 * @returns
	 */
	@Get(':repo_id/versions')
	@UseGuards(RepositoriesGuard)
	public async getAllVersions(@Repo() repo: Repository) {
		const versions = repo.driver.getVersionsSorted(
			await this.releases.getAllVersions(repo),
			'desc'
		);

		return { versions };
	}

}
