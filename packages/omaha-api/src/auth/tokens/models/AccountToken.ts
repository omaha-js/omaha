import { AuthScopeId } from 'src/auth/auth.scopes';
import { Account } from 'src/entities/Account';
import { BaseToken } from './BaseToken';

/**
 * This token is used to authenticate for an account and can grant access to scopes for both the account and all of its
 * repositories.
 */
export class AccountToken extends BaseToken {

	public constructor(public readonly account: Account, scopes: AuthScopeId[], expiresIn: number) {
		super(scopes, expiresIn);
	}

	public isForAccount(): boolean {
		return true;
	}

}
