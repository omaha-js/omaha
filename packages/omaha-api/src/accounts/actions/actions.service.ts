import { Injectable, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/entities/Account';
import { AccountAction } from 'src/entities/AccountAction';
import { AccountActionType } from 'src/entities/enum/AccountActionType';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import crypto, { randomBytes } from 'crypto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ActionsService {

	public constructor(
		@InjectRepository(AccountAction) private readonly repository: Repository<AccountAction>,
	) {}

	/**
	 * Gets an action from its token. Throws an error if not found or if the token is not a full match.
	 *
	 * @param token
	 */
	public async getAction<T = any>(token: string): Promise<AccountAction<T>> {
		const buffer = Buffer.from(token, 'base64');

		// Tokens will always consist of 256 bits of data
		if (buffer.length === 32) {
			// Extract parameters from the token
			const tokenId = buffer.slice(0, 5);
			const key = buffer.slice(5);

			// Find a matching token from the database
			const match = await this.repository.findOne({
				where: { id: tokenId, expires_at: MoreThan(new Date()) },
				relations: { account: true }
			});

			if (match) {
				// Validate the token's hash against the given key
				const salt = match.hash.slice(0, 16);
				const hash = Buffer.concat([
					salt,
					crypto.createHash('sha256').update(Buffer.concat([salt, tokenId, key])).digest()
				]);

				if (Buffer.compare(match.hash, hash) === 0) {
					return match;
				}
			}
		}

		throw new NotFoundException('Invalid or expired token');
	}

	/**
	 * After an action has been used successfully, it must be consumed. Not only will this delete the token and prevent
	 * it from being used again, but it will also delete other tokens for the same account and type.
	 *
	 * @param action
	 */
	public async consumeAction(action: AccountAction) {
		return this.repository.delete({
			type: action.type,
			account: { id: action.account.id }
		});
	}

	/**
	 * Creates a new account action that expires in 15 minutes.
	 *
	 * @param account The account this action belongs to.
	 * @param type The type of action.
	 * @param metadata Optional metadata associated with the action.
	 * @returns
	 *   The new action, as well as the token associated with it. This token is not stored and cannot be retrieved
	 *   again in the future. It should be sent to the user via email immediately.
	 */
	public async createAction<T = any>(account: Account, type: AccountActionType, metadata?: T): Promise<ActionResult<T>> {
		const id = await this.generateTokenId();
		const key = randomBytes(27);

		const salt = randomBytes(16);
		const hash = Buffer.concat([
			salt,
			crypto.createHash('sha256').update(Buffer.concat([salt, id, key])).digest()
		]);

		const action = this.repository.create({
			id,
			type,
			metadata: metadata ?? {},
			expires_at: new Date(Date.now() + 9e5),
			hash,
			account
		});

		const token = Buffer.concat([id, key]).toString('base64').replace(/=+$/, '');

		await this.repository.save(action);
		return { token, action };
	}

	/**
	 * Generates a unique token ID consisting of 5 random bytes.
	 * @returns
	 */
	private async generateTokenId(): Promise<Buffer> {
		for (let attempt = 0; attempt < 30; attempt++) {
			const bytes = randomBytes(5);
			const existing = await this.repository.count({ where: { id: bytes } })

			if (existing === 0) {
				return bytes;
			}
		}

		throw new RequestTimeoutException('Token generation timed out');
	}

	@Cron('0 0 * * * *')
	protected async cleanExpiredTokens() {
		return this.repository.delete({
			expires_at: LessThanOrEqual(new Date())
		});
	}

}

export interface ActionResult<T> {
	token: string;
	action: AccountAction<T>;
}
