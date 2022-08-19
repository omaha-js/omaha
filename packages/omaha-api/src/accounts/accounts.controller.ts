import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { CollaborationsService } from 'src/repositories/collaborations/collaborations.service';
import { User } from 'src/support/User';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/UpdateAccountDto';

@Controller('account')
export class AccountsController {

	public constructor(
		private readonly service: AccountsService,
		private readonly collaborations: CollaborationsService,
	) {}

	@Get()
	@UseScopes('account.settings.read')
	public showAccountOverview(@User() token: AccountToken) {
		return token.account;
	}

	@Patch()
	@UseScopes('account.settings.manage')
	public async updateAccount(@User() token: AccountToken, @Body() dto: UpdateAccountDto) {
		if (dto.email !== undefined) {
			await this.service.verifyPassword(token.account, dto.existingPassword);
			await this.service.setAccountEmail(token.account, dto.email);
		}

		if (dto.password !== undefined) {
			await this.service.verifyPassword(token.account, dto.existingPassword);
			await this.service.setAccountPassword(token.account, dto.password);
		}

		if (dto.name !== undefined) {
			await this.service.setAccountName(token.account, dto.name);
		}

		return token.account;
	}

	@Get('accept_invitation/:invite_id')
	@UseScopes('account.repos.manage')
	public async getInvitation(@User() token: AccountToken, @Param('invite_id') id: string) {
		const account = token.account;
		const invite = await this.collaborations.getInviteById(id);

		if (!invite) {
			throw new NotFoundException('The invitation does not exist or was already accepted');
		}

		if (invite.expires_at.getTime() <= Date.now()) {
			throw new BadRequestException('The invitation has expired');
		}

		const repository = await invite.repository;
		const existing = await this.collaborations.getForAccountAndRepository(account, repository);

		if (existing) {
			throw new BadRequestException('You are already a collaborator of that repository');
		}

		return invite;
	}

	@Post('accept_invitation/:invite_id')
	@UseScopes('account.repos.manage')
	public async acceptInvitation(@User() token: AccountToken, @Param('invite_id') id: string) {
		const account = token.account;
		const invite = await this.getInvitation(token, id);
		const repository = await invite.repository;

		const collab = await this.collaborations.create(
			repository,
			account,
			invite.role,
			invite.scopes
		);

		await this.collaborations.deleteInvite(invite);
		return instanceToPlain(collab, { groups: ['repo'] });
	}

}
