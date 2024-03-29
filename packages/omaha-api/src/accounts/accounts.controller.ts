import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Request } from 'express';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { EmailService } from 'src/email/email.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UseRateLimit } from 'src/ratelimit/ratelimit.decorator';
import { CollaborationsService } from 'src/repositories/collaborations/collaborations.service';
import { User } from 'src/support/User';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/UpdateAccountDto';

@Controller('account')
export class AccountsController {

	public constructor(
		private readonly service: AccountsService,
		private readonly collaborations: CollaborationsService,
		private readonly notifications: NotificationsService,
		private readonly email: EmailService,
	) {}

	@Get()
	@UseScopes('account.settings.read')
	public showAccountOverview(@User() token: AccountToken) {
		return token.account;
	}

	@Patch()
	@UseScopes('account.settings.manage')
	public async updateAccount(@User() token: AccountToken, @Body() dto: UpdateAccountDto, @Req() request: Request) {
		if (dto.email !== undefined) {
			await this.service.verifyPassword(token.account, dto.existingPassword);
			await this.service.setAccountEmail(token.account, dto.email);
		}

		if (dto.password !== undefined && dto.existingPassword !== dto.password) {
			await this.service.verifyPassword(token.account, dto.existingPassword);
			await this.service.setAccountPassword(token.account, dto.password);
			await this.email.send({
				to: token.account.email,
				subject: 'Your password has been changed',
				template: 'password_changed',
				context: {
					account: token.account,
					time: new Date(),
					ip: request.ip
				}
			});
		}

		if (dto.name !== undefined) {
			await this.service.setAccountName(token.account, dto.name);
		}

		return token.account;
	}

	@Get('accept_invitation/:invite_id')
	@UseScopes('account.repos.manage')
	@UseRateLimit(5, 10, 10)
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
	@UseRateLimit(5, 10, 10)
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
		await this.notifications.sendForRepo(repository, 'repo_collab_accepted', {
			collaboration: collab,
			collaborationAccount: account
		});

		return instanceToPlain(collab, { groups: ['repo'] });
	}

	@Post('actions/resend_verification')
	@UseScopes('account.settings.manage')
	@UseRateLimit(1, 3, 5)
	public async resendVerification(@User() token: AccountToken) {
		if (!token.account.verification_required) {
			throw new BadRequestException('Your email address does not need to be verified at this time');
		}

		await this.service.sendVerificationEmail(token.account);

		return {
			success: true,
			message: `We've sent you a new verification email`
		};
	}

}
