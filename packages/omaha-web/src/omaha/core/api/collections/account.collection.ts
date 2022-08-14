import { ApiWorker } from '../Api';
import { plainToInstance } from 'class-transformer';
import { AccountSettingsDto } from '../dtos/AccountSettingsDto';
import { IAccountUpdateResponse } from '../responses/account.responses';
import { account } from '../../SessionManager';
import { Account } from '@omaha/client';

export default function (api: ApiWorker) {
	return {
		/**
		 * Updates the current account's settings.
		 *
		 * @param settings
		 *
		 * @throws {ApiError} for invalid input
		 */
		async update(settings: AccountSettingsDto): Promise<Account> {
			const response = await api.patch<IAccountUpdateResponse>('/v1/account', settings);
			account.set(response.account);
			return response.account;
		},
	};
};
