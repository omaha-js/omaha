import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Collaboration } from 'src/entities/Collaboration';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { Repository } from 'src/entities/Repository';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UseRateLimit } from 'src/ratelimit/ratelimit.decorator';
import { Collab } from 'src/support/Collab';
import { Repo } from 'src/support/Repo';
import { RepositoriesGuard } from '../repositories.guard';
import { CollaborationsService } from './collaborations.service';
import { CreateCollaborationDto } from './dto/CreateCollaborationDto';
import { UpdateCollaborationDto } from './dto/UpdateCollaborationDto';

@Controller('repositories/:repo_id/collaborations')
@UseGuards(RepositoriesGuard)
export class CollaborationsController {

	public constructor(
		private readonly service: CollaborationsService,
		private readonly notifications: NotificationsService
	) {}

	@Get()
	@UseScopes('repo.collaborations.list')
	public async getCollaborations(@Repo() repo: Repository) {
		return {
			collaborations: await this.service.getForRepository(repo),
			invites: await this.service.getInvitesForRepository(repo)
		};
	}

	@Get(':collab_id')
	@UseScopes('repo.collaborations.list')
	public async getCollaboration(@Repo() repo: Repository, @Param('collab_id') id: string) {
		const target = await this.service.getForRepositoryById(repo, id);

		if (!target) {
			throw new NotFoundException('No collaboration matching that ID could be found for this repository');
		}

		return target;
	}

	@Patch(':collab_id')
	@UseScopes('repo.collaborations.manage')
	public async updateCollaboration(
		@Repo() repo: Repository,
		@Param('collab_id') id: string,
		@Body() params: UpdateCollaborationDto,
		@Collab() collab: Collaboration
	) {
		const target = await this.service.getForRepositoryById(repo, id);

		if (!target) {
			throw new NotFoundException('No collaboration matching that ID could be found for this repository');
		}

		// Prevent self modification
		if (collab.id === target.id) {
			throw new BadRequestException('You cannot modify your own collaboration');
		}

		// Prevent assignment of unprivileged scopes
		if (Array.isArray(params.scopes)) {
			params.scopes = params.scopes.filter(scope => collab.hasPermission(scope));
		}

		// Role indices
		const roles: CollaborationRole[] = [
			CollaborationRole.Owner,
			CollaborationRole.Manager,
			CollaborationRole.Auditor,
			CollaborationRole.Custom
		];

		const collabIndex = roles.indexOf(collab.role);
		const targetExistingIndex = roles.indexOf(target.role);

		if (targetExistingIndex < collabIndex) {
			throw new BadRequestException('You cannot manage this collaborator because they are a higher role than you');
		}

		// Prevent assignment of roles beyond our own
		if (params.role && params.role !== CollaborationRole.Custom) {
			const targetIndex = roles.indexOf(params.role);

			if (collab.role === CollaborationRole.Custom) {
				throw new BadRequestException('You cannot assign special roles, please use custom instead');
			}

			if (targetIndex < collabIndex) {
				throw new BadRequestException('You cannot assign this role because it is higher than your own');
			}
		}

		return this.service.update(target, params.role, params.scopes);
	}

	@Delete(':collab_id')
	public async deleteCollaboration(
		@Repo() repo: Repository,
		@Param('collab_id') id: string,
		@Collab() collab: Collaboration
	) {
		const target = await this.service.getForRepositoryById(repo, id);

		if (!target) {
			throw new NotFoundException('No collaboration matching that ID could be found for this repository');
		}

		// Enforce scope unless this is our own collaboration
		if (collab.id !== target.id) {
			if (!collab.hasPermission('repo.collaborations.manage')) {
				throw new ForbiddenException('You do not have privileges to access this endpoint');
			}
		}

		// Make sure at least one owner will remain
		const collabs = await repo.collaborators;
		const owners = collabs.filter(collab => collab.role === CollaborationRole.Owner && collab.id !== target.id);

		if (owners.length === 0) {
			throw new BadRequestException('There must be at least one owner remaining in the repository');
		}

		// Prevent deletion of roles beyond our own
		if (target.role !== CollaborationRole.Custom) {
			const roles: CollaborationRole[] = [
				CollaborationRole.Owner,
				CollaborationRole.Manager,
				CollaborationRole.Auditor,
				CollaborationRole.Custom
			];

			const collabIndex = roles.indexOf(collab.role);
			const targetIndex = roles.indexOf(target.role);

			if (targetIndex < collabIndex) {
				throw new BadRequestException('You cannot delete this collaboration because it is a higher role than you');
			}
		}

		const account = await target.account;
		const response = await this.service.delete(target);

		await this.notifications.sendForRepo(repo, 'repo_collab_removed', {
			collaboration: target,
			collaborationAccount: account,
			wasKicked: target.id !== collab.id
		});

		return response;
	}

	@Post()
	@UseScopes('repo.collaborations.manage')
	@UseRateLimit(10, 20, 30)
	public async createCollaboration(@Repo() repo: Repository, @Body() params: CreateCollaborationDto) {
		if (Array.isArray(params.scopes) && params.scopes.length > 0 && params.role !== CollaborationRole.Custom) {
			throw new BadRequestException(`You cannot provide scopes when 'role' does not equal 'custom'`);
		}

		if (await this.service.getInviteForRepositoryAndEmail(repo, params.email)) {
			throw new BadRequestException('An invitation already exists for that email address');
		}

		const invite = await this.service.createInvite(repo, params.email, params.role, params.scopes ?? []);
		await this.notifications.sendForRepo(repo, 'repo_collab_invite', {
			invite
		});

		return invite;
	}

	@Get('invites/:invite_id')
	@UseScopes('repo.collaborations.list')
	@UseRateLimit(5, 10, 10)
	public async getInvite(@Repo() repo: Repository, @Param('invite_id') id: string) {
		const invite = await this.service.getInviteForRepositoryById(repo, id);

		if (!invite) {
			throw new NotFoundException('No such invitation was found, it may have already been accepted');
		}

		await invite.repository;

		return invite;
	}

	@Patch('invites/:invite_id')
	@UseScopes('repo.collaborations.manage')
	public async updateInvite(@Repo() repo: Repository, @Param('invite_id') id: string, @Body() params: UpdateCollaborationDto) {
		const invite = await this.service.getInviteForRepositoryById(repo, id);

		if (!invite) {
			throw new NotFoundException('No such invitation was found, it may have already been accepted');
		}

		return this.service.updateInvite(invite, params.role, params.scopes);
	}

	@Delete('invites/:collab_id')
	@UseScopes('repo.collaborations.manage')
	public async deleteInvite(@Repo() repo: Repository, @Param('collab_id') id: string) {
		const invite = await this.service.getInviteForRepositoryById(repo, id);

		if (!invite) {
			throw new NotFoundException('No such invitation was found, it may have already been accepted');
		}

		return this.service.deleteInvite(invite);
	}

}
