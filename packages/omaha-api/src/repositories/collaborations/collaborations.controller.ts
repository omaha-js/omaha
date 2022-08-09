import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Collaboration } from 'src/entities/Collaboration';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { Repository } from 'src/entities/Repository';
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
		private readonly service: CollaborationsService
	) {}

	@Get()
	@UseScopes('repo.collaborations.list')
	public async getCollaborations(@Repo() repo: Repository) {
		return {
			collaborations: await this.service.getForRepository(repo),
			invites: await this.service.getInvitesForRepository(repo)
		};
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

		// Prevent assignment of roles beyond our own
		if (params.role && params.role !== CollaborationRole.Custom) {
			const roles: CollaborationRole[] = [CollaborationRole.Owner, CollaborationRole.Manager, CollaborationRole.Auditor];
			const collabIndex = roles.indexOf(collab.role);
			const targetIndex = roles.indexOf(params.role);

			if (collabIndex < 0) {
				throw new BadRequestException('You cannot assign special roles, please use custom instead');
			}

			if (targetIndex < collabIndex) {
				throw new BadRequestException('You cannot assign this role because it is higher than your own');
			}
		}

		return this.service.update(target, params.role, params.scopes);
	}

	@Delete(':collab_id')
	@UseScopes('repo.collaborations.manage')
	public async deleteCollaboration(
		@Repo() repo: Repository,
		@Param('collab_id') id: string,
		@Collab() collab: Collaboration
	) {
		const target = await this.service.getForRepositoryById(repo, id);

		if (!target) {
			throw new NotFoundException('No collaboration matching that ID could be found for this repository');
		}

		// Prevent self deletion
		if (collab.id === target.id) {
			throw new BadRequestException('You cannot delete your own collaboration');
		}

		// Prevent deletion of roles beyond our own
		if (target.role !== CollaborationRole.Custom) {
			const roles: CollaborationRole[] = [CollaborationRole.Owner, CollaborationRole.Manager, CollaborationRole.Auditor];
			const collabIndex = roles.indexOf(collab.role);
			const targetIndex = roles.indexOf(target.role);

			if (targetIndex < collabIndex) {
				throw new BadRequestException('You cannot delete this collaboration because it is a higher role than you');
			}
		}

		return this.service.delete(target);
	}

	@Post()
	@UseScopes('repo.collaborations.manage')
	public async createCollaboration(@Repo() repo: Repository, @Body() params: CreateCollaborationDto) {
		if (Array.isArray(params.scopes) && params.scopes.length > 0 && params.role !== CollaborationRole.Custom) {
			throw new BadRequestException(`You cannot provide scopes when 'role' does not equal 'custom'`);
		}

		if (await this.service.getInviteForRepositoryAndEmail(repo, params.email)) {
			throw new BadRequestException('An invitation already exists for that email address');
		}

		return this.service.createInvite(repo, params.email, params.role, params.scopes ?? []);
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
