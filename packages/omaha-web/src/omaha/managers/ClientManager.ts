import { Omaha } from '@omaha/client';
import { Manager } from '../framework/Manager';
import { createStore, Store } from '../helpers/stores';

export class ClientManager extends Manager {

	/**
	 * A boolean indicating whether or not the client is currently having trouble connecting to the backend.
	 */
	private isConnectError = false;

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
			this.recordConnectError();
		});

		client.on('client_recovered', (attempts) => {
			this.recordConnectSuccess();
		});

		return [client, error, loading, dispose];
	}

	/**
	 * Notifies the user that we're having trouble connecting.
	 */
	private recordConnectError() {
		if (!this.isConnectError) {
			this.isConnectError = true;
			this.omaha.alerts.error(
				`We're having trouble connecting to the server right now. ` +
				`We'll keep trying in the background.`
			);
		}
	}

	/**
	 * Notifies the user that we're reconnected.
	 */
	private recordConnectSuccess() {
		if (this.isConnectError) {
			this.isConnectError = false;
			this.omaha.alerts.success('Reconnected successfully.', 5000);
		}
	}

}

type ClientComponentReturnArray = [
	client: Omaha,
	error: Store<string | undefined>,
	loading: Store<boolean>,
	dispose: () => void
];
