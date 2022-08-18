import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { TokenType } from 'src/entities/enum/TokenType';
import { Collaboration } from 'src/entities/Collaboration';
import { Repository } from 'src/entities/Repository';
import { Collab } from 'src/support/Collab';
import { Repo } from 'src/support/Repo';
import { RepositoriesGuard } from '../repositories.guard';
import { CreateRepoTokenDto } from './dto/CreateRepoTokenDto';
import { UpdateRepoTokenDto } from './dto/UpdateRepoTokenDto';
import { DownloadsService } from '../releases/downloads/downloads.service';

@Controller('repositories/:repo_id/tokens')
@UseGuards(RepositoriesGuard)
export class TokensController {

	public constructor(
		private readonly service: TokensService,
		private readonly downloads: DownloadsService,
	) {}

	@Get()
	@UseScopes('repo.tokens.list')
	public async getTokens(@Repo() repo: Repository) {
		return repo.tokens;
	}

	@Post()
	@UseScopes('repo.tokens.manage')
	public async createToken(@Repo() repo: Repository, @Body() params: CreateRepoTokenDto, @Collab() collab: Collaboration) {
		const scopes = params.scopes.filter(scope => collab.hasPermission(scope));

		return await this.service.createDatabaseToken({
			name: params.name,
			description: params.description,
			expiration: params.expiration,
			type: TokenType.Repository,
			repository: repo,
			scopes
		});
	}

	@Get(':id')
	@UseScopes('repo.tokens.list')
	public async getToken(@Repo() repo: Repository, @Param('id') id: string) {
		const token = await this.service.getDatabaseTokenForRepository(repo, id);

		if (!token) {
			throw new NotFoundException('No token matching the given ID was found');
		}

		return token;
	}

	@Patch(':id')
	@UseScopes('repo.tokens.manage')
	public async updateToken(
		@Repo() repo: Repository,
		@Body() params: UpdateRepoTokenDto,
		@Param('id') id: string,
		@Collab() collab: Collaboration
	) {
		const token = await this.service.getDatabaseTokenForRepository(repo, id);

		if (!token) {
			throw new NotFoundException('No token matching the given ID was found');
		}

		if (params.scopes) {
			params.scopes = params.scopes.filter(scope => collab.hasPermission(scope));
		}

		return await this.service.updateDatabaseToken(token, params);
	}

	@Delete(':id')
	@UseScopes('repo.tokens.manage')
	public async deleteToken(@Repo() repo: Repository, @Param('id') id: string) {
		const token = await this.service.getDatabaseTokenForRepository(repo, id);

		if (!token) {
			throw new NotFoundException('No token matching the given ID was found');
		}

		await this.service.deleteDatabaseToken(token);

		return {
			success: true,
			message: 'Token has been deleted successfully.'
		};
	}

}
