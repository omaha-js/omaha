import { Injectable, InternalServerErrorException, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Environment } from 'src/app.environment';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { QueuedNotification } from 'src/entities/QueuedNotification';
import { Repository } from 'src/entities/Repository';
import { Repository as TypeOrmRepository } from 'typeorm';
import { EmailService } from 'src/email/email.service';
import { ItemQueue } from '@baileyherbert/queue';
import twig from 'twig';
import path from 'path';
import { getAppLink } from 'src/support/utilities/links';
import { Account } from 'src/entities/Account';

import {
	RepoNotificationList,
	RepoNotificationEvents,
	RepoNotificationId,
	NotificationId,
	AccountNotificationId,
	AccountNotificationEvents,
	AccountNotificationList
} from './notifications.types';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {

	private readonly logger = new Logger('NotificationsService');
	private readonly templatesDir = path.resolve(__dirname, '../../templates/notifications');
	private readonly queue = new ItemQueue<QueuedNotification>(item => this._onTask(item), {
		maxConcurrentTasks: 3
	});

	public constructor(
		@InjectRepository(QueuedNotification) private readonly repository: TypeOrmRepository<QueuedNotification>,
		private readonly email: EmailService,
	) {
		this.queue.on('taskCompleted', async notification => {
			return this.repository.delete(notification.id);
		});

		this.queue.on('taskFailed', async (error, notification) => {
			this.logger.error('Failed to send notification #%d:', notification.id, error);
			setTimeout(() => this.queue.push(notification), 60000).unref();
		});
	}

	/**
	 * Sends a notification for a repository.
	 *
	 * @param repository
	 * @param id
	 * @param args
	 */
	public async sendForRepo<K extends RepoNotificationId>(repository: Repository, id: K, args: RepoNotificationEvents[K]) {
		const event = RepoNotificationList.find(item => item.id === id);

		if (!event) {
			throw new InternalServerErrorException(`Missing notification list entry for ${id}`);
		}

		const roles = event.roles as readonly CollaborationRole[];
		const collabs = await repository.collaborators;
		const messages = new Array<MessageBuffer>();

		for (const collaborator of collabs) {
			if (roles.includes(collaborator.role)) {
				const account = await collaborator.account;

				if (Array.isArray(account.notifications) && account.notifications.includes(id)) {
					continue;
				}

				if (Array.isArray(collaborator.notifications) && collaborator.notifications.includes(id)) {
					continue;
				}

				const [subject, content] = await this.render(id, { ...args, repository, account });
				const title = `[${repository.name}] ${subject}`;

				messages.push({
					email: account.email,
					subject: title,
					content
				});
			}
		}

		return this.enqueue(messages);
	}

	/**
	 * Sends a notification for an account.
	 *
	 * @param account
	 * @param id
	 * @param args
	 */
	public async sendForAccount<K extends AccountNotificationId>(account: Account, id: K, args: AccountNotificationEvents[K]) {
		const event = AccountNotificationList.find(item => item.id === id);

		if (!event) {
			throw new InternalServerErrorException(`Missing notification list entry for ${id}`);
		}

		if (Array.isArray(account.notifications) && account.notifications.includes(id)) {
			return;
		}

		const [subject, content] = await this.render(id, { ...args, account });

		return this.enqueue([{
			email: account.email,
			subject,
			content
		}]);
	}

	/**
	 * Queues the given messages for sending.
	 *
	 * @param messages
	 */
	private async enqueue(messages: MessageBuffer[]) {
		if (messages.length === 0) {
			return;
		}

		if (!this.email.enabled) {
			return;
		}

		const tasks = await this.repository.manager.transaction(async manager => {
			const notifications = new Array<QueuedNotification>();

			for (const message of messages) {
				const notification = this.repository.create({
					email: message.email,
					subject: message.subject,
					message: message.content
				});

				notifications.push(
					await this.repository.save(notification)
				);
			}

			return notifications;
		});

		for (const task of tasks) {
			this.queue.push(task);
		}
	}

	/**
	 * Renders the template for the specified notification, using the given arguments object as context.
	 *
	 * @param id
	 * @param args
	 * @returns
	 */
	private render(id: NotificationId, args: any) {
		return new Promise<[subject: string, content: string]>((resolve, reject) => {
			const context = {
				...args,
				env: Environment,
				url: getAppLink
			};

			twig.renderFile(path.resolve(this.templatesDir, id + '.twig'), context, (err, html) => {
				if (err) return reject(err);

				const lines = html.trim().split(/(?:\r?\n)/);
				const match = lines.shift().match(/^@@ +(.+)$/);

				if (!match) {
					return reject(new InternalServerErrorException(
						`Notification template for ${id} did not have a subject line!`
					));
				}

				const subject = match[1].trim();
				const content = lines.join('\n').trim();

				resolve([subject, content]);
			});
		});
	}

	/**
	 * Sends a notification.
	 *
	 * @param notification
	 */
	private async _onTask(notification: QueuedNotification) {
		return this.email.sendRaw({
			to: notification.email,
			subject: notification.subject,
			content: notification.message
		});
	}

	/**
	 * Loads outstanding tasks from the database on startup.
	 */
	public async onModuleInit() {
		const tasks = await this.repository.find({
			order: {
				id: 'asc'
			}
		});

		if (tasks.length > 0) {
			this.logger.log('Requeued %d outgoing notifications from previous run', tasks.length);

			for (const task of tasks) {
				this.queue.push(task);
			}
		}
	}

	/**
	 * Gracefully stops the queue on shutdown.
	 *
	 * @returns
	 */
	public onModuleDestroy() {
		if (this.queue.active) {
			this.logger.log('Waiting for outgoing notifications to finish sending...');
		}

		return this.queue.stopAsync();
	}

}

interface MessageBuffer {
	email: string;
	subject: string;
	content: string;
}
