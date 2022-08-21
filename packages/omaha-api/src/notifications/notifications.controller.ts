import { BadRequestException, Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { AccountToken } from 'src/auth/tokens/models/AccountToken';
import { Collaboration } from 'src/entities/Collaboration';
import { Repository } from 'src/entities/Repository';
import { CollaborationsService } from 'src/repositories/collaborations/collaborations.service';
import { RepositoriesGuard } from 'src/repositories/repositories.guard';
import { Collab } from 'src/support/Collab';
import { Repo } from 'src/support/Repo';
import { User } from 'src/support/User';
import { NotificationList, RepoNotificationList, NotificationId } from './notifications.types';

@Controller('notifications')
export class NotificationsController {

	public constructor(
		private readonly accounts: AccountsService,
		private readonly collaborations: CollaborationsService,
	) {}

	@Get('account')
	@UseScopes('account.notifications.manage')
	public async getNotificationsForAccount(@User() token: AccountToken) {
		const disabled = Array.isArray(token.account.notifications) ? token.account.notifications : [];
		const notifications = NotificationList.map(item => ({
			id: item.id,
			description: item.description,
			enabled: !disabled.includes(item.id)
		}));

		return {
			notifications
		};
	}

	@Patch('account')
	@UseScopes('account.notifications.manage')
	public async updateNotificationsForAccount(@User() token: AccountToken, @Body() body: any) {
		const allowed = NotificationList.map(item => item.id);

		const result = this.getStateFromBody(token.account.notifications, allowed, body);
		await this.accounts.setNotifications(token.account, result);

		return this.getNotificationsForAccount(token);
	}

	@Get('repository/:repo_id')
	@UseGuards(RepositoriesGuard)
	@UseScopes('account.notifications.manage')
	public async getNotificationsForRepo(@User() token: AccountToken, @Collab() collab: Collaboration) {
		const accountDisabled = Array.isArray(token.account.notifications) ? token.account.notifications : [];
		const collabDisabled = Array.isArray(collab.notifications) ? collab.notifications : [];
		const notifications = RepoNotificationList.map(item => ({
			id: item.id,
			description: item.description,
			account_enabled: !accountDisabled.includes(item.id),
			enabled: !collabDisabled.includes(item.id) && !accountDisabled.includes(item.id)
		}));

		return {
			notifications
		};
	}

	@Patch('repository/:repo_id')
	@UseGuards(RepositoriesGuard)
	@UseScopes('account.notifications.manage')
	public async updateNotificationsForRepo(@User() token: AccountToken, @Collab() collab: Collaboration, @Body() body: any) {
		const allowed = RepoNotificationList.map(item => item.id);

		const result = this.getStateFromBody(collab.notifications, allowed, body);
		await this.collaborations.setNotifications(collab, result);

		return this.getNotificationsForRepo(token, collab);
	}

	/**
	 * Computes a new `notifications` array for storage on the account or collaboration, from the given body.
	 *
	 * @param existing The existing notifications array from the database.
	 * @param allowed An array of allowed notification IDs for this request.
	 * @param body The parsed request body.
	 * @returns
	 */
	private getStateFromBody<T extends NotificationId>(existing: NotificationId[], allowed: T[], body: any): T[] {
		if (typeof body !== 'object') {
			throw new BadRequestException('Invalid type of request body received');
		}

		if (!Array.isArray(existing)) {
			existing = [];
		}

		let transformed = [...existing];

		for (const key in body) {
			if (allowed.includes(key as any)) {
				const enabled = body[key] as boolean;

				if (enabled) {
					transformed = transformed.filter(id => id !== key);
				}
				else {
					if (transformed.find(id => id === key) === undefined) {
						transformed.push(key as any);
					}
				}
			}
		}

		return transformed as T[];
	}

}
