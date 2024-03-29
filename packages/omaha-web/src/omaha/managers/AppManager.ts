import { AppConstants } from '@omaha/client';
import { Manager } from '../framework/Manager';

export class AppManager extends Manager {

	private _constants?: AppConstants;

	public constructor() {
		super('AppManager');
	}

	/**
	 * Starts the manager.
	 */
	protected override async bootstrap() {
		this._constants = await this.client.constants();
	}

	/**
	 * The application's constants.
	 */
	public get constants() {
		if (!this._constants) {
			throw new Error('Constants not loaded yet -- this should never happen!');
		}

		return this._constants;
	}

	/**
	 * Builds a page title for the application.
	 *
	 * @param segments
	 * @returns
	 */
	public title(...segments: string[]) {
		segments.push(this.constants.app_name);

		return (
			segments.map(s => s.trim())
			.filter(s => s.length > 0)
			.join(' - ')
		);
	}

}
