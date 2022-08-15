import { Omaha } from '@omaha/client';
import { Manager } from '../framework/Manager';
import { createStore, Store } from '../helpers/stores';

export class ClientManager extends Manager {

	/**
	 * Constructs a new instance of the manager.
	 */
	public constructor() {
		super('ClientManager');
	}

	/**
	 * Creates a client instance for use within a component, and returns a loading store, an error store, and a
	 * function to dispose of the client when the component is detached.
	 *
	 * @returns [client, loading, error, dispose]
	 */
	public useFromComponent(): ClientComponentReturnArray {
		const client = this.client.derive();
		const loading = createStore(false);
		const error = createStore<string>();
		const dispose = () => client.dispose();

		client.on('loading_start', () => {
			error.set(undefined);
			loading.set(true);
		});

		client.on('loading_stop', () => {
			loading.set(false);
		});

		client.on('server_error', err => {
			error.set(err.message);
		});

		client.on('client_error', (err, attempt) => {
			if (attempt === 0) {
				this.omaha.alerts.error(
					`We're having trouble connecting to the server right now. ` +
					`We'll keep trying in the background.`
				);
			}
		});

		client.on('client_recovered', (attempts) => {
			if (attempts > 0) {
				this.omaha.alerts.success('Reconnected to the server successfully.', 5000);
			}
		});

		return [client, error, loading, dispose];
	}

}

type ClientComponentReturnArray = [
	client: Omaha,
	error: Store<string | undefined>,
	loading: Store<boolean>,
	dispose: () => void
];
