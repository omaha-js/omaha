import { NotificationManager } from '../NotificationManager';

export class ApiError extends Error {

	public constructor(message: string | string[], public readonly code: number) {
		super(Array.isArray(message) ? message.join(', ') : message);
	}

	/**
	 * Shows an error notification with this error's message.
	 *
	 * @param duration
	 */
	public showNotification(duration?: number) {
		NotificationManager.error(this.message, duration);
	}

}
