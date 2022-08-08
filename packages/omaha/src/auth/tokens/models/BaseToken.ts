import { AuthScopeId } from 'src/auth/auth.scopes';
import { Account } from 'src/entities/Account';
import { Repository } from 'src/entities/Repository';
import { Token } from 'src/entities/Token';
import { AccountToken } from './AccountToken';

export abstract class BaseToken {

	/**
	 * @param scopes The scopes that this token grants.
	 * @param expiresAt The millisecond timestamp at which this token expires.
	 */
	public constructor(public readonly scopes: AuthScopeId[], public readonly expiresAt: number) {

	}

	/**
	 * The number of milliseconds remaining for this token's lifespan.
	 */
	public get ttl() {
		if (this.expiresAt === 0) {
			return 315360000000;
		}

		return Math.max(0, this.expiresAt - Date.now());
	}

	/**
	 * Returns true if this token grants access to an account.
	 *
	 * @returns
	 */
	public isForAccount(): this is TokenForAccount {
		return false;
	}

	/**
	 * Returns true if this token grants access to a repository.
	 *
	 * @returns
	 */
	public isForRepository(): this is TokenForRepository {
		return false;
	}

	/**
	 * Returns true if this token was loaded from the database.
	 *
	 * @returns
	 */
	public isDatabaseToken(): this is TokenFromDatabase {
		return false;
	}

	/**
	 * Returns true if this token grants permission for the given scope.
	 *
	 * @param scope
	 */
	public hasPermission(scope: AuthScopeId) {
		return this.scopes.includes(scope);
	}

}

export interface TokenForAccount extends BaseToken {
	account: Account;
}

export interface TokenForRepository extends BaseToken {
	repository: Repository;
}

export interface TokenFromDatabase extends BaseToken {
	token: Token;
}
