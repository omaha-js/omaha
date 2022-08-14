import { Account } from '@omaha/client';

export interface IAccountUpdateResponse {
	success: true;
	messages: string[];
	account: Account;
}
