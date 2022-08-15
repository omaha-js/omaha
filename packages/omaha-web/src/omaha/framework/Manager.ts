import { Logger } from '@baileyherbert/logging';
import { client, logger } from '../globals';
import omaha from '..';

export class Manager {

	/**
	 * The logger for this manager.
	 */
	protected logger: Logger;

	/**
	 * The API client for this manager.
	 */
	protected client = client;

	public constructor(className: string) {
		this.logger = logger.createChild(className);
	}

	/**
	 * Bootstraps the manager. This is invoked before the application starts and should be used for any initialization
	 * logic.
	 */
	protected async bootstrap() {

	}

	protected get omaha() {
		return omaha;
	}

}
