import { Account } from 'src/omaha/models/Account';

export interface IAccountUpdateResponse {
	success: true;
	messages: string[];
	account: Account;
}
