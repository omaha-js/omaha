import { createStore } from '../helpers/stores';
import { Color, NotificationIcon } from '../theme';

class NotificationManagerImpl {

	/**
	 * Internal incrementer for notification IDs.
	 */
	private nextNotificationId = 1;

	/**
	 * An array containing all active notifications.
	 */
	public readonly notifications = createStore<INotification[]>([]);

	/**
	 * Pushes the given notification onto the render stack.
	 *
	 * @param notification
	 */
	public push(notification: INotificationRequest) {
		const id = this.nextNotificationId++;
		const duration = notification.duration ?? 10000;

		// Add the notification
		this.notifications.update(notifications => {
			notifications.unshift({
				id,
				title: notification.title,
				message: notification.message,
				color: notification.color,
				icon: notification.icon
			});

			if (notifications.length > 5) {
				notifications.pop();
			}

			return notifications;
		});

		// Remove the notification after the duration has elapsed
		setTimeout(() => {
			this.notifications.update(notifications => {
				return notifications.filter(n => n.id !== id);
			});
		}, duration);
	}

	/**
	 * Shows a success notification.
	 *
	 * @param message
	 * @param duration
	 */
	public success(message: string, duration?: number) {
		return this.push({
			title: 'Success!',
			message,
			duration,
			icon: 'checkmark',
			color: 'green'
		});
	}

	/**
	 * Shows an error notification.
	 *
	 * @param message
	 * @param duration
	 */
	public error(message: string, duration?: number) {
		return this.push({
			title: 'Error!',
			message,
			duration,
			icon: 'alert',
			color: 'red'
		});
	}

	/**
	 * Shows an information notification.
	 *
	 * @param message
	 * @param duration
	 */
	public info(message: string, duration?: number) {
		return this.push({
			title: 'Notice!',
			message,
			duration,
			icon: 'info',
			color: 'blue'
		});
	}

}

export const NotificationManager = new NotificationManagerImpl();
export const { notifications } = NotificationManager;

export interface INotification {
	/**
	 * The unique ID of the notification.
	 */
	id: number;

	/**
	 * The title of the notification.
	 */
	title: string;

	/**
	 * The message content of the notification.
	 */
	message: string;

	/**
	 * The highlight color of the notification.
	 */
	color: Color;

	/**
	 * The icon to use for the notification.
	 */
	icon: NotificationIcon;
}

export interface INotificationRequest extends Omit<INotification, 'id'> {
	/**
	 * Customizes the number of milliseconds to show the notification for.
	 */
	duration?: number;
}
