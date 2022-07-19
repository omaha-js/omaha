import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from 'src/auth/dto/RegisterDto';
import { Account } from 'src/entities/Account';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { LoginDto } from 'src/auth/dto/LoginDto';

@Injectable()
export class AccountsService {

	public constructor(
		@InjectRepository(Account) private readonly repository: Repository<Account>
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

		// Save it to the database
		return this.repository.save(account);
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
