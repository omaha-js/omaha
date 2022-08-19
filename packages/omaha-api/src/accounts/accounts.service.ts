import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from 'src/auth/dto/RegisterDto';
import { Account } from 'src/entities/Account';
import { Repository } from 'typeorm';
import { LoginDto } from 'src/auth/dto/LoginDto';
import { CollaborationsService } from 'src/repositories/collaborations/collaborations.service';
import { CollaborationInvite } from 'src/entities/CollaborationInvite';
import { Environment } from 'src/app.environment';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

@Injectable()
export class AccountsService {

	public constructor(
		@InjectRepository(Account) private readonly repository: Repository<Account>,
		private readonly collaborations: CollaborationsService
	) {}

	/**
	 * Creates a new account.
	 *
	 * @param dto
	 * @returns
	 */
	public async createAccount(dto: RegisterDto) {
		// Check if the account already exists in the repository
		if (await this.repository.count({ where: { email: dto.email }}) > 0) {
			throw new BadRequestException('An account with that email already exists');
		}

		// Create a new account from the repository
		const hash = await this.getPasswordHash(dto.password);
		const account = this.repository.create({
			name: dto.name,
			email: dto.email,
			password: hash
		});

		// Save to the database
		await this.repository.save(account);

		// Automatically accept invitations
		if (typeof dto.invitation === 'string') {
			const invite = await this.collaborations.getInviteById(dto.invitation);

			if (invite) {
				try {
					await this.acceptInvite(account, invite);

					// Automatically verify email address
					if (typeof dto.invitationToken === 'string') {
						const payload = Environment.APP_SECRET + invite.id + invite.expires_at.getTime();
						const token = crypto.createHash('sha1').update(payload).digest('hex');

						if (token === dto.invitationToken) {
							account.verified = true;
							await this.repository.save(account);
						}
					}
				}
				catch (err) {
					// Silently fail to avoid disrupting registration
				}
			}
		}

		// Return the account model
		return account;
	}

	/**
	 * Accepts the given collaboration invite for the account.
	 *
	 * @param account
	 * @param invite
	 * @returns
	 */
	public async acceptInvite(account: Account, invite: CollaborationInvite) {
		if (invite.expires_at.getTime() <= Date.now()) {
			throw new BadRequestException('The invitation has expired');
		}

		const repository = await invite.repository;
		const existing = await this.collaborations.getForAccountAndRepository(account, repository);

		if (existing) {
			throw new BadRequestException('You are already a collaborator of that repository');
		}

		const collab = await this.collaborations.create(
			repository,
			account,
			invite.role,
			invite.scopes
		);

		await this.collaborations.deleteInvite(invite);

		return collab;
	}

	/**
	 * Hashes the given password with bcrypt.
	 *
	 * @param password
	 * @returns
	 */
	public async getPasswordHash(password: string) {
		return bcrypt.hash(password, 11);
	}

	/**
	 * Attempts to retrieve an account from an email address and password combination.
	 *
	 * @param dto
	 * @returns
	 */
	public async login(dto: LoginDto) {
		const account = await this.repository.findOne({ where: { email: dto.email }});

		if (account) {
			if (await bcrypt.compare(dto.password, account.password)) {
				return account;
			}
		}

		throw new UnauthorizedException('Incorrect email or password');
	}

	/**
	 * Returns the specified account or undefined if not found.
	 *
	 * @param id
	 * @returns
	 */
	public async find(id: number): Promise<Account | undefined> {
		return await this.repository.findOne({ where: { id }}) || undefined;
	}

	/**
	 * Returns the specified account or throws an error if not found.
	 *
	 * @param id
	 * @returns
	 */
	public async findOrFail(id: number): Promise<Account> {
		return await this.repository.findOneOrFail({ where: { id }});
	}

	/**
	 * Checks that the given password matches the account. Throws an error if not.
	 *
	 * @param account
	 * @param password
	 * @returns
	 */
	public async verifyPassword(account: Account, password?: string) {
		if (typeof password !== 'string' || password.length === 0) {
			throw new BadRequestException('You must confirm your existing password for this update');
		}

		if (!await bcrypt.compare(password, account.password)) {
			throw new BadRequestException('Existing password does not match');
		}
	}

	/**
	 * Changes an account's name.
	 *
	 * @param account
	 * @param name
	 * @returns
	 */
	public async setAccountName(account: Account, name: string) {
		if (account.name !== name) {
			account.name = name;
			return this.repository.save(account);
		}
	}

	/**
	 * Changes an account's email address.
	 *
	 * @param account
	 * @param email
	 * @returns
	 */
	public async setAccountEmail(account: Account, email: string) {
		if (account.email !== email) {
			account.email = email;
			account.verified = false;

			return this.repository.save(account);
		}
	}

	/**
	 * Changes an account's password.
	 *
	 * @param account
	 * @param password
	 * @returns
	 */
	public async setAccountPassword(account: Account, password: string) {
		account.password = await this.getPasswordHash(password);
		return this.repository.save(account);
	}

}
