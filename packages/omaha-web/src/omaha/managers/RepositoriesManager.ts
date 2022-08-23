import { RepositoryWithCollaboration } from '@omaha/client';
import { Manager } from '../framework/Manager';
import { createStore } from '../helpers/stores';

export class RepositoriesManager extends Manager {

	/**
	 * Whether or not the repositories list is loading.
	 */
	public loading = createStore(false);

	/**
	 * The repositories for the current account.
	 */
	public repositories = createStore<RepositoryWithCollaboration[]>([]);

	/**
	 * Constructs a new instance of the manager.
	 */
	public constructor() {
		super('RepositoriesManager');
	}

	/**
	 * Refreshes the repositories list.
	 */
	public async refresh() {
		this.loading.set(true);

		try {
			const repositories = await this.client.repos.list();

			if (JSON.stringify(this.repositories.get()) !== JSON.stringify(repositories)) {
				this.repositories.set(repositories);
				this.logger.info('Fetched %d repositories for the current account', repositories.length);
			}
		}
		catch (error) {
			this.logger.error('Failed to fetch repositories:', error);
		}
		finally {
			this.loading.set(false);
		}
	}

}
