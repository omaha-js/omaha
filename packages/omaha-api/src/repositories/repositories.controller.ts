import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, InternalServerErrorException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Environment } from 'src/app.environment';
import { Private } from 'src/auth/decorators/private.decorator';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { BaseToken } from 'src/auth/tokens/models/BaseToken';
import { Collaboration } from 'src/entities/Collaboration';
import { Repository } from 'src/entities/Repository';
import { NotificationsService } from 'src/notifications/notifications.service';
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
		private readonly releases: ReleasesService,
		private readonly notifications: NotificationsService,
	) {}

	/**
	 * Lists all repositories that the requester has access to.
	 *
	 * @param token
	 * @returns
	 */
	@Get()
	public getRepositoryList(@User() token?: BaseToken) {
		if (token) {
			if (token.isForAccount()) {
				return this.service.getRepositoriesForAccount(token.account);
			}
			else if (token.isForRepository()) {
				return [token.repository];
			}
		}

		return [];
	}

	@Post()
	@UseScopes('account.repos.manage')
	public async createRepository(@Body() dto: CreateRepoDto, @User() token: AccountToken) {
		if (Environment.WHITELIST_CREATE_REPO.trim().length > 0) {
			const allowedDomains = Environment.WHITELIST_CREATE_REPO
				.split(',')
				.map(str => str.trim().toLowerCase())
				.filter(str => str.length > 0);

			const match = token.account.email.match(/@([^@]+$)/);

			if (!match) {
				throw new InternalServerErrorException('Failed to check email address against whitelist');
			}

			const domain = match[1].toLowerCase();
			if (!allowedDomains.includes(domain)) {
				throw new BadRequestException('Your account is not eligible to create repositories');
			}
		}

		if (token.account.verification_required) {
			throw new BadRequestException('You must verify your email address before creating a repository!');
		}

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
		const originalAccess = repo.access;
		const response = await this.service.updateRepository(repo, dto);

		if (response.access !== originalAccess) {
			await this.notifications.sendForRepo(repo, 'repo_visibility_updated', {
				previous: originalAccess,
				next: response.access
			});
		}

		return response;
	}

	@Delete(':repo_id')
	@Private()
	@UseGuards(RepositoriesGuard)
	public async deleteRepository(@Repo() repo: Repository, @User() token: BaseToken, @Collab() collab?: Collaboration) {
		if (!collab || collab.role !== CollaborationRole.Owner) {
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
	@Private()
	public async restoreRepository(@Param('repo_id') id: string, @User() token: BaseToken) {
		const repo = await this.service.getDeletedRepository(id);

		if ((!token || !token.isForAccount()) || token.isDatabaseToken()) {
			throw new BadRequestException('Deleted repositories can only be restored from a web session');
		}

		if (!token.hasPermission('account.repos.manage')) {
			throw new ForbiddenException('You do not have access to the requested repository');
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

	@Get('restore/:repo_id')
	@Private()
	public async getDeletedRepository(@Param('repo_id') id: string, @User() token: BaseToken) {
		const repo = await this.service.getDeletedRepository(id);

		if ((!token || !token.isForAccount()) || token.isDatabaseToken()) {
			throw new BadRequestException('Invalid authentication type');
		}

		if (!token.hasPermission('account.repos.manage')) {
			throw new ForbiddenException('You do not have access to the requested repository');
		}

		const collabs = await repo.collaborators;

		for (const collab of collabs) {
			const account = await collab.account;

			if (account.id === token.account.id) {
				if (collab.role === CollaborationRole.Owner) {
					return repo;
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

		return versions;
	}

}
