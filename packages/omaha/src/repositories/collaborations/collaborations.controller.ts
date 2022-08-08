import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { Repository } from 'src/entities/Repository';
import { Repo } from 'src/support/Repo';
import { RepositoriesGuard } from '../repositories.guard';
import { CollaborationsService } from './collaborations.service';
import { CreateCollaborationDto } from './dto/CreateCollaborationDto';

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
	public async updateInvite(@Param('invite_id') id: string, @Body() params: CreateCollaborationDto) {
		const invite = await this.service.getInviteById(id);

		if (!invite) {
			throw new NotFoundException('No such invitation was found, it may have already been accepted');
		}

		return this.service.updateInvite(invite, params.role, params.scopes);
	}

	@Delete('invites/:collab_id')
	@UseScopes('repo.collaborations.manage')
	public async deleteInvite(@Param('collab_id') id: string) {
		const invite = await this.service.getInviteById(id);

		if (!invite) {
			throw new NotFoundException('No such invitation was found, it may have already been accepted');
		}

		return this.service.deleteInvite(invite);
	}

}
