import { Account } from 'src/omaha/models/Account';

export interface IAuthLoginResponse {
	token: string;
	account: Account;
}

export type IAuthIdentityResponse = IAuthIdentityGuestResponse | IAuthIdentityAccountResponse;

export interface IAuthIdentityGuestResponse {
	access: 'unauthenticated';
	scopes: string[];
}

export interface IAuthIdentityAccountResponse {
	access: 'account';
	ttl: number;
	scopes: string[];
	account: Account;
}
