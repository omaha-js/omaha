import { AuthScopeId, RepositoryScopeId } from 'src/auth/auth.scopes';
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
		return Math.max(0, this.expiresAt - Date.now());
	}

	/**
	 * Returns true if this token grants access to an account.
	 *
	 * @returns
	 */
	public isForAccount(): this is AccountToken {
		return false;
	}

	/**
	 * Returns true if this token grants access to a repository.
	 *
	 * @returns
	 */
	public isForRepository() {
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
