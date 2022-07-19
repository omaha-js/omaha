import { ApiError } from './ApiError';
import { NotificationManager } from '../NotificationManager';
import { token } from '../SessionManager';
import authCollection from './collections/auth.collection';
import { createStore, Store } from 'src/omaha/helpers/stores';
import accountCollection from './collections/account.collection';

class ApiImpl {

	public constructor(
		private readonly error?: Store<string | undefined>,
		private readonly loading?: Store<boolean>
	) {}

	/**
	 * A collection of predefined functions for interacting with the API.
	 */
	public readonly request = {
		auth: authCollection(this),
		account: accountCollection(this),
	};

	/**
	 * Sends a `GET` request.
	 *
	 * @param path
	 * @returns
	 */
	public get<T = any>(path: string) {
		return this.send<T>('GET', path);
	}

	/**
	 * Sends a `POST` request.
	 *
	 * @param path
	 * @param content
	 * @returns
	 */
	public post<T = any>(path: string, content?: any) {
		return this.send<T>('POST', path, content);
	}

	/**
	 * Sends a `PUT` request.
	 *
	 * @param path
	 * @param content
	 * @returns
	 */
	public put<T = any>(path: string, content?: any) {
		return this.send<T>('PUT', path, content);
	}

	/**
	 * Sends a `PATCH` request.
	 *
	 * @param path
	 * @param content
	 * @returns
	 */
	public patch<T = any>(path: string, content?: any) {
		return this.send<T>('PATCH', path, content);
	}

	/**
	 * Sends a `DELETE` request.
	 *
	 * @param path
	 * @param content
	 * @returns
	 */
	public delete<T = any>(path: string, content?: any) {
		return this.send<T>('DELETE', path, content);
	}

	/**
	 * Sends a request to the API.
	 *
	 * @param method
	 * @param path
	 * @param content
	 * @param isReattempt
	 * @returns
	 */
	private async send<T = any>(method: string, path: string, content?: any, isReattempt = false): Promise<T> {
		const headers: Record<string, string> = {
			'content-type': 'application/json',
		};

		if (token.get()) {
			headers['authorization'] = 'Bearer ' + token.get();
		}

		this.error?.set(undefined);
		this.loading?.set(true);

		const reattempt = async () => {
			if (!isReattempt) {
				NotificationManager.error(
					`We're having trouble connecting to the API right now. ` +
					`We'll keep trying in the background.`
				);
			}

			await new Promise(r => setTimeout(r, 2000));
			return this.send(method, path, content, true);
		}

		try {
			const response = await fetch(path, {
				method,
				headers,
				body: content !== undefined ? JSON.stringify(content) : undefined
			})

			if (response.status >= 500) {
				return reattempt();
			}

			const json = await response.json();

			if (response.status >= 400) {
				throw new ApiError(json.message, response.status);
			}

			if (isReattempt) {
				NotificationManager.success('Reconnected to the API successfully.', 5000);
			}

			this.loading?.set(false);
			return json;
		}
		catch (error) {
			this.loading?.set(false);

			if (error instanceof ApiError) {
				this.error?.set(error.message);
				throw error;
			}

			return reattempt();
		}
	}

}

export const Api = new ApiImpl();
export type ApiWorker = typeof Api;

/**
 * This hook returns a tuple containing an error store, a loading store, and an API instance. Combined, these values
 * can be used to concisely work with the API and to implement loading and error states.
 *
 * @returns
 */
export function useApi(): [api: ApiImpl, error: Store<string | undefined>, loading: Store<boolean>] {
	const error = createStore<string>(undefined);
	const loading = createStore(false);
	const api = new ApiImpl(error, loading);

	return [api, error, loading];
}
