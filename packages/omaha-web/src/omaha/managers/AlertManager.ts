import { Manager } from '../framework/Manager';
import { createStore } from '../helpers/stores';
import { Color, AlertIcon } from '../helpers/theme';

export class AlertManager extends Manager {

	/**
	 * Constructs a new instance of the manager.
	 */
	public constructor() {
		super('AlertManager');
	}

	/**
	 * Internal incrementer for alert IDs.
	 */
	private nextAlertId = 1;

	/**
	 * An array containing all active alerts.
	 */
	public readonly alerts = createStore<IAlert[]>([]);

	/**
	 * Pushes the given alert onto the render stack.
	 *
	 * @param alert
	 */
	public push(alert: IAlertOptions) {
		const id = this.nextAlertId++;
		const duration = alert.duration ?? 10000;

		// Add the notification
		this.alerts.update(alerts => {
			alerts.unshift({
				id,
				title: alert.title,
				message: alert.message,
				color: alert.color,
				icon: alert.icon
			});

			if (alerts.length > 5) {
				alerts.pop();
			}

			return alerts;
		});

		// Remove the alert after the duration has elapsed
		setTimeout(() => {
			this.alerts.update(alerts => {
				return alerts.filter(n => n.id !== id);
			});
		}, duration);
	}

	/**
	 * Shows a success alert.
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
	 * Shows an error alert.
	 *
	 * @param message
	 * @param duration
	 */
	public error(message: string, duration?: number): void;
	public error(message: Error | any, duration?: number): void;
	public error(message: any, duration?: number) {
		if (message instanceof Error) {
			message = message.message;
		}

		return this.push({
			title: 'Error!',
			message,
			duration,
			icon: 'alert',
			color: 'red'
		});
	}

	/**
	 * Shows an information alert.
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

export interface IAlert {

	/**
	 * The unique ID of the alert.
	 */
	id: number;

	/**
	 * The title of the alert.
	 */
	title: string;

	/**
	 * The message content of the alert.
	 */
	message: string;

	/**
	 * The highlight color of the alert.
	 */
	color: Color;

	/**
	 * The icon to use for the alert.
	 */
	icon: AlertIcon;

}

export interface IAlertOptions extends Omit<IAlert, 'id'> {

	/**
	 * Customizes the number of milliseconds to show the alert for.
	 */
	duration?: number;

}
