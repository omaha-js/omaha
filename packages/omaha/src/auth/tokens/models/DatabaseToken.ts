import { Account } from 'src/entities/Account';
import { Repository } from 'src/entities/Repository';
import { Token } from 'src/entities/Token';
import { TokenType } from '../tokens.types';
import { BaseToken } from './BaseToken';

/**
 * This token is used to authenticate a specific account or repository with variable permission scopes.
 */
export class DatabaseToken extends BaseToken {

	private instance?: any;

	public constructor(private readonly token: Token) {
		const expiration = token.expiration ? token.expiration.getTime() : 0;
		super(token.scopes, expiration);
	}

	public isForAccount(): boolean {
		return this.token.type === TokenType.Account;
	}

	public isForRepository(): boolean {
		return this.token.type === TokenType.Repository;
	}

	/**
	 * Loads the underlying account or repository. Returns `true` if successful.
	 *
	 * @returns
	 */
	public async init() {
		if (this.instance) {
			return true;
		}

		if (this.isForAccount()) {
			this.instance = await this.token.account;
		}
		else {
			this.instance = await this.token.repository;
		}

		return !!this.instance;
	}

	/**
	 * The underlying account instance.
	 */
	public get account(): Account {
		if (!this.isForAccount()) {
			throw new Error('Call to "account" getter on a repository-scoped database token');
		}

		if (!this.instance) {
			throw new Error('Call to "account" getter on an uninitialized database token');
		}

		return this.instance;
	}

	/**
	 * The underlying account instance.
	 */
	public get repository(): Repository {
		if (!this.isForRepository()) {
			throw new Error('Call to "repository" getter on an account-scoped database token');
		}

		if (!this.instance) {
			throw new Error('Call to "repository" getter on an uninitialized database token');
		}

		return this.instance;
	}

}
