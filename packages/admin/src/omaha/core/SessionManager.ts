import { createStore } from '../helpers/stores';
import { Account } from '../models/Account';
import { Api } from './api/Api';

class SessionManagerImpl {

	public readonly loading = createStore(true);

	/**
	 * The current account data or undefined if logged out.
	 */
	public readonly account = createStore<Account>(undefined);

	/**
	 * The current session token or undefined if logged out.
	 */
	public readonly token = createStore<string>(undefined);

	/**
	 * Loads an existing session from storage if applicable.
	 */
	public async init() {
		const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');

		if (token) {
			this.token.set(token);

			try {
				const account = await Api.request.auth.getAccountIdentity();
				this.account.set(account);

				if (!account) {
					this.clear();
				}
			}
			catch (err) {
				this.clear();
			}
		}

		this.loading.set(false);
	}

	/**
	 * Sets the session and saves it to storage.
	 *
	 * @param token The new token assigned from the API
	 * @param account The account model returned from the API
	 * @param persist
	 *   Store the token in persistent storage, rather than session storage. When not specified, it will reuse the
	 *   persistence setting for the current session, and default to `false` for new sessions.
	 */
	public set(token: string, account: Account, persist?: boolean) {
		if (persist === undefined) {
			persist = !!localStorage.getItem('token');
		}

		(persist ? localStorage : sessionStorage).setItem('token', token);

		this.token.set(token);
		this.account.set(account);
	}

	/**
	 * Clears the session from storage.
	 */
	public clear() {
		localStorage.removeItem('token');
		sessionStorage.removeItem('token');

		this.token.set(undefined);
		this.account.set(undefined);
	}

}

export const SessionManager = new SessionManagerImpl();
export const { account, token } = SessionManager;
export const sessionLoading = SessionManager.loading;
