import { Account } from 'src/omaha/models/Account';
import { SessionManager, token } from '../../SessionManager';
import { ApiWorker } from '../Api';
import { IAuthIdentityResponse, IAuthLoginResponse } from '../responses/auth.responses';
import { plainToInstance } from 'class-transformer';

export default function (api: ApiWorker) {
	return {
		/**
		 * Attempts to log into the given account.
		 *
		 * @param email
		 * @param password
		 * @param persist
		 *
		 * @throws {ApiError} for authentication issues
		 */
		async login(email: string, password: string, persist?: boolean): Promise<Account> {
			const response = await api.post<IAuthLoginResponse>('/v1/auth/login', {
				email,
				password
			});

			const account = plainToInstance(Account, response.account);
			SessionManager.set(response.token, account, persist);

			return account;
		},

		/**
		 * Attempts to register an account with the given details.
		 *
		 * @param name
		 * @param email
		 * @param password
		 * @param persist
		 *
		 * @throws {ApiError} for authentication issues
		 */
		async register(name: string, email: string, password: string, persist?: boolean): Promise<Account> {
			const response = await api.post<IAuthLoginResponse>('/v1/auth/register', {
				name,
				email,
				password
			});

			const account = plainToInstance(Account, response.account);
			SessionManager.set(response.token, account, persist);

			return account;
		},

		/**
		 * Gets the identity for the current token or returns `undefined` if the token is invalid or not for an
		 * account.
		 */
		async getAccountIdentity() {
			try {
				const response = await api.get<IAuthIdentityResponse>('/v1/auth/identity');

				if (response.access === 'account') {
					return plainToInstance(Account, response.account);
				}
			}
			catch (err) {}

			return;
		},
	};
};
