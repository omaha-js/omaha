import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Account } from 'src/entities/Account';
import { Environment } from 'src/app.environment';
import { AllScopeIds, AuthScopeId } from '../auth.scopes';
import { AccountToken } from './models/AccountToken';
import { AccountsService } from 'src/accounts/accounts.service';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { BaseToken } from './models/BaseToken';

@Injectable()
export class TokensService {

	public constructor(
		private readonly accounts: AccountsService
	) {}

	/**
	 * Creates a token string for the given account.
	 *
	 * @param account
	 * @param expiresIn Seconds to expiration.
	 */
	public async createAccountToken(account: Account, expiresIn: number | undefined = 86400) {
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
	 * Verifies and parses the given token.
	 *
	 * @param token
	 * @throws UnauthorizedException
	 */
	public async getToken(token: string) {
		const delimiterOffset = token.indexOf('.');

		if (delimiterOffset > 0) {
			const type = Buffer.from(token.substring(0, delimiterOffset), 'base64').toString('ascii');
			const data = token.substring(delimiterOffset + 1);

			switch (type) {
				case 'jsonwebtoken': return this.getTokenFromJWT(data);
				case 'usertoken': return this.getTokenFromDatabase(data);
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
	private async getTokenFromJWT(token: string): Promise<BaseToken> {
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
	private async getTokenFromDatabase(token: string): Promise<BaseToken> {
		throw new UnauthorizedException('Database tokens are not implemented');
	}

}

interface WebTokenPayload {
	id: number,
	token: string
};
