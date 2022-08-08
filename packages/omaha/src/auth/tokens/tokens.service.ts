import { BadRequestException, Injectable, RequestTimeoutException, UnauthorizedException } from '@nestjs/common';
import { Account } from 'src/entities/Account';
import { Environment } from 'src/app.environment';
import { AllScopeIds, AuthScopeId, RepositoryScopeId } from '../auth.scopes';
import { AccountToken } from './models/AccountToken';
import { AccountsService } from 'src/accounts/accounts.service';
import jwt from 'jsonwebtoken';
import crypto, { randomBytes } from 'crypto';
import { BaseToken } from './models/BaseToken';
import { TokenType } from '../../entities/enum/TokenType';
import { Repository } from 'src/entities/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Token } from 'src/entities/Token';
import { DatabaseToken } from './models/DatabaseToken';

@Injectable()
export class TokensService {

	public constructor(
		private readonly accounts: AccountsService,
		@InjectRepository(Token) private readonly repository: TypeOrmRepository<Token>
	) {}

	/**
	 * Creates a JSON web token to authorize full access on the given account.
	 *
	 * @param account
	 * @param expiresIn Seconds to expiration.
	 */
	public async createWebToken(account: Account, expiresIn: number | undefined = 86400) {
		const payload: WebTokenPayload = {
			id: account.id,
			token: crypto.createHash('sha256').update(account.password).digest('hex')
		};

		const token = await new Promise<string>((resolve, reject) => {
			jwt.sign(payload, Environment.APP_SECRET, { expiresIn }, function(err, token) {
				err ? reject(err) : resolve(token);
			});
		});

		return Buffer.from('jsonwebtoken').toString('base64') + '.' + token;
	}

	/**
	 * Creates a new database bearer token with the given parameters that grants scoped access to a specific account or
	 * repository.
	 *
	 * The resulting token will consist of a unique 40-bit identifier, as well as a secret salted hash. The returned
	 * object will contain a 256-bit encoded `key` whose first 40 bits correspond to the token's identifier. The
	 * remaining 216 bits in the token must validate against the secret hash to authenticate.
	 *
	 * In production, the key must be returned to the end user and forgotten. The end user will be responsible for the
	 * safe storage of this key, as it cannot be recovered.
	 *
	 * @param params
	 * @returns
	 */
	public async createDatabaseToken(params: CreateTokenParams) {
		if (typeof params.expiration === 'number') {
			if (params.expiration <= 0) {
				params.expiration = undefined;
			}
			else {
				params.expiration += Date.now();
			}
		}

		const id = await this.generateDatabaseTokenId();
		const key = randomBytes(27);

		const salt = randomBytes(16);
		const hash = Buffer.concat([
			salt,
			crypto.createHash('sha256').update(Buffer.concat([salt, id, key])).digest()
		]);

		const token = this.repository.create({
			id,
			name: params.name,
			description: params.description ?? '',
			expires_at: params.expiration ? new Date(params.expiration) : undefined,
			hash,
			type: params.type,
			scopes: params.scopes
		});

		if (params.type === TokenType.Repository) {
			token.repository = Promise.resolve(params.repository);
		}

		else if (params.type === TokenType.Account) {
			token.account = Promise.resolve(params.account);
		}

		else {
			throw new BadRequestException('Unknown token type');
		}

		const publicKey = (
			Buffer.from('token').toString('base64').replace(/=+$/, '') + '.' +
			Buffer.concat([id, key]).toString('base64').replace(/=+$/, '')
		);

		await this.repository.save(token);

		return {
			key: publicKey,
			token
		};
	}

	/**
	 * Updates an existing database token from the given parameters.
	 *
	 * @param token
	 * @param params
	 */
	public async updateDatabaseToken(token: Token, params: EditTokenParams) {
		let publicKey: string | undefined  = undefined;

		if (typeof params.name === 'string') {
			token.name = params.name;
		}

		if (typeof params.description === 'string') {
			token.description = params.description;
		}

		if (Array.isArray(params.scopes)) {
			token.scopes = params.scopes;
		}

		// Invalidation – regenerate the key upon request
		if (params.invalidate) {
			const key = randomBytes(27);
			const salt = randomBytes(16);

			const hash = Buffer.concat([
				salt,
				crypto.createHash('sha256').update(Buffer.concat([salt, token.id, key])).digest()
			]);

			publicKey = (
				Buffer.from('token').toString('base64').replace(/=+$/, '') + '.' +
				Buffer.concat([token.id, key]).toString('base64').replace(/=+$/, '')
			);

			token.hash = hash;
		}

		await this.repository.save(token);

		return {
			key: publicKey,
			token
		};
	}

	public async deleteDatabaseToken(token: Token) {
		return this.repository.delete({
			id: token.id
		});
	}

	/**
	 * Returns a database token from the given repository by its ID. Returns `undefined` if not found.
	 *
	 * @param repo
	 * @param id
	 * @returns
	 */
	public async getDatabaseTokenForRepository(repo: Repository, id: string | Buffer) {
		if (typeof id === 'string') {
			id = Buffer.from(id, 'hex');
		}

		return this.repository.findOne({
			where: {
				repository: { id: repo.id },
				id
			}
		});
	}

	/**
	 * Returns a database token from the given account by its ID. Returns `undefined` if not found.
	 *
	 * @param account
	 * @param id
	 * @returns
	 */
	public async getDatabaseTokenForAccount(account: Account, id: string | Buffer) {
		if (typeof id === 'string') {
			id = Buffer.from(id, 'hex');
		}

		return this.repository.findOne({
			where: {
				account: { id: account.id },
				id
			}
		});
	}

	/**
	 * Verifies and parses the given token. Returns `undefined` if it's not valid.
	 *
	 * @param token
	 */
	public async getToken(token: string): Promise<BaseToken | undefined> {
		const delimiterOffset = token.indexOf('.');

		if (delimiterOffset > 0) {
			const type = Buffer.from(token.substring(0, delimiterOffset), 'base64').toString('ascii');
			const data = token.substring(delimiterOffset + 1);

			try {
				switch (type) {
					case 'jsonwebtoken': return this.getTokenFromJWT(data);
					case 'token': return this.getTokenFromDatabase(data);
				}
			}
			catch (_) {
				return;
			}
		}

		return;
	}

	/**
	 * Verifies and parses the given token.
	 *
	 * @param token
	 * @throws UnauthorizedException
	 */
	public async getTokenOrFail(token: string): Promise<BaseToken> {
		const delimiterOffset = token.indexOf('.');

		if (delimiterOffset > 0) {
			const type = Buffer.from(token.substring(0, delimiterOffset), 'base64').toString('ascii');
			const data = token.substring(delimiterOffset + 1);

			switch (type) {
				case 'jsonwebtoken': return this.getTokenFromJWT(data);
				case 'token': return this.getTokenFromDatabase(data);
			}
		}

		throw new UnauthorizedException('Invalid token');
	}

	/**
	 * Validates and returns a token in JWT format.
	 *
	 * @param token
	 * @returns
	 */
	private async getTokenFromJWT(token: string): Promise<AccountToken> {
		const success = await new Promise<boolean>(resolve => {
			jwt.verify(token, Environment.APP_SECRET, function(err, decoded) {
				err ? resolve(false) : resolve(true);
			});
		});

		if (success) {
			const decoded = jwt.decode(token) as WebTokenPayload & { exp: number };
			const account = await this.accounts.findOrFail(decoded.id);
			const expiresAt = decoded.exp * 1000;

			if (crypto.createHash('sha256').update(account.password).digest('hex') !== decoded.token) {
				throw new UnauthorizedException(
					'The token is no longer valid because the password for its account has since been changed'
				);
			}

			return new AccountToken(account, AllScopeIds, expiresAt);
		}

		throw new UnauthorizedException('Invalid token');
	}

	/**
	 * Validates and returns a token from the database.
	 *
	 * @param token
	 */
	private async getTokenFromDatabase(token: string): Promise<DatabaseToken> {
		const buffer = Buffer.from(token, 'base64');

		// Tokens will always consist of 256 bits of data
		if (buffer.length === 32) {
			// Extract parameters from the token
			const tokenId = buffer.slice(0, 5);
			const key = buffer.slice(5);

			// Find a matching token from the database
			const match = await this.repository.findOne({ where: { id: tokenId }});

			if (match) {
				// Validate the token's hash against the given key
				const salt = match.hash.slice(0, 16);
				const hash = Buffer.concat([
					salt,
					crypto.createHash('sha256').update(Buffer.concat([salt, tokenId, key])).digest()
				]);

				if (Buffer.compare(match.hash, hash) === 0) {
					// Initialize the database token
					const dbToken = new DatabaseToken(match);

					// Check for expirations
					if (dbToken.ttl > 0) {
						if (await dbToken.init()) {
							return dbToken;
						}
					}
				}
			}
		}

		throw new UnauthorizedException('Invalid token');
	}

	/**
	 * Generates a unique token ID consisting of 5 random bytes.
	 * @returns
	 */
	private async generateDatabaseTokenId(): Promise<Buffer> {
		for (let attempt = 0; attempt < 30; attempt++) {
			const bytes = randomBytes(5);
			const existing = await this.repository.count({ where: { id: bytes } })

			if (existing === 0) {
				return bytes;
			}
		}

		throw new RequestTimeoutException('Token generation timed out');
	}

}

interface WebTokenPayload {
	id: number,
	token: string
};

interface BaseTokenParams {
	name: string;
	description?: string;
	expiration: number;
	type: TokenType;
}

interface CreateRepoTokenParams extends BaseTokenParams {
	type: TokenType.Repository;
	scopes: RepositoryScopeId[];
	repository: Repository;
}

interface CreateAccountTokenParams extends BaseTokenParams {
	type: TokenType.Account;
	scopes: AuthScopeId[];
	account: Account;
}

type CreateTokenParams = CreateAccountTokenParams | CreateRepoTokenParams;

interface EditTokenParams {
	name?: string;
	description?: string;
	scopes?: AuthScopeId[];
	invalidate?: boolean;
}
