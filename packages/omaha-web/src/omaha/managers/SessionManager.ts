import { Account, Omaha, Scope, UnauthorizedError } from '@omaha/client';
import { Manager } from '../framework/Manager';
import { createStore } from '../helpers/stores';

export class SessionManager extends Manager {

	/**
	 * The current authentication token or `undefined` if not logged in.
	 */
	public token = createStore<string>();

	/**
	 * The current authenticated account or `undefined` if not logged in.
	 */
	public account = createStore<Account>();

	/**
	 * The scopes that the current account has access to.
	 */
	public scopes = createStore<Scope[]>([]);

	/**
	 * Constructs a new instance of the manager.
	 */
	public constructor() {
		super('SessionManager');
	}

	/**
	 * Starts the manager.
	 */
	protected override async bootstrap() {
		const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');

		if (token) {
			this.logger.info('Resuming session from an existing token...');

			if (!await this.updateToken(token)) {
				this.logger.warning('You have been signed out due to an authentication error.');
				this.clear();
			}
		}
		else {
			this.logger.info('No session found');
		}
	}

	/**
	 * Logs in with the given token and updates local storage. Returns `true` for success or `false` for failure.
	 *
	 * @param token
	 *   The new token assigned from the API.
	 * @param persist
	 *   Store the token in persistent storage, rather than session storage. When not specified, it will reuse the
	 *   persistence setting for the current session, and default to `false` for new sessions.
	 */
	public async login(token: string, persist?: boolean) {
		if (persist === undefined) {
			persist = !!localStorage.getItem('token');
		}

		(persist ? localStorage : sessionStorage).setItem('token', token);

		return this.updateToken(token);
	}

	/**
	 * Clears the session from storage.
	 */
	public clear() {
		localStorage.removeItem('token');
		sessionStorage.removeItem('token');

		this.token.set(undefined);
		this.account.set(undefined);
		this.scopes.set([]);

		this.client.setToken();
	}

	/**
	 * Clears the token but keeps other state unchanged. This is only intended for immediate reauthorization (e.g.
	 * after changing an account's password).
	 */
	public clearForReauth() {
		this.token.set(undefined);
		this.client.setToken();
	}

	/**
	 * Fetches the account and scopes associated with the given token, updates internal state, and returns `true` if
	 * successful, or `false` if the token was invalid.
	 *
	 * @param token
	 */
	private async updateToken(token: string) {
		try {
			this.logger.info('Retrieving account information...');

			const client = this.createClientForToken(token);
			const identity = await client.auth.identity();

			if (identity.access !== 'account') {
				throw new Error('The token was not for an account');
			}

			this.token.set(token);
			this.account.set(identity.account);
			this.scopes.set(identity.scopes);
			this.client.setToken(token);

			this.logger.info(
				'Logged in as %s <%s>',
				identity.account.name,
				identity.account.email
			);

			await this.omaha.repositories.refresh();
			return true;
		}
		catch (error) {
			this.logger.error('Failed to authenticate with token:', error);
			return false;
		}
	}

	/**
	 * Creates a new client instance for the given token.
	 *
	 * @param token
	 * @returns
	 */
	private createClientForToken(token?: string) {
		return new Omaha((new URL('/', document.URL)).href, {
			reattemptFailedCount: 0,
			token
		});
	}

	/**
	 * Creates a new client instance for the current token with retries disabled.
	 *
	 * @returns
	 */
	private createClientWithoutRetries() {
		return new Omaha((new URL('/', document.URL)).href, {
			reattemptFailed: false,
			token: this.token.get()
		});
	}

	/**
	 * Refreshes the current account's identity.
	 */
	public async refresh() {
		if (!this.token.get()) {
			return;
		}

		try {
			const client = this.createClientWithoutRetries();
			const identity = await client.auth.identity();

			if (identity.access !== 'account') {
				this.logger.warning('New authentication status was:', identity.access);
				this.clear();
				return;
			}

			this.account.set(identity.account);
			this.scopes.set(identity.scopes);

			this.logger.info('Refreshed account information');
		}
		catch (error) {
			if (error instanceof UnauthorizedError) {
				this.logger.warning('Authentication token is no longer valid');
				this.clear();
				return;
			}

			this.logger.error('Error while refreshing account information:', error);
		}
	}

}
