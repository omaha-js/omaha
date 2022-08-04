import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryScopeId } from 'src/auth/auth.scopes';
import { Account } from 'src/entities/Account';
import { Collaboration } from 'src/entities/Collaboration';
import { Repository } from 'src/entities/Repository';
import { Repository as TypeOrmRepository } from 'typeorm';
import { CollaborationRole } from '../../entities/enum/CollaborationRole';

@Injectable()
export class CollaborationsService {

	public constructor(
		@InjectRepository(Collaboration) private readonly repository: TypeOrmRepository<Collaboration>
	) {}

	/**
	 * Finds all collaborations for the given account.
	 *
	 * @param account
	 * @returns
	 */
	public getForAccount(account: Account) {
		return this.repository.find({
			where: {
				account: {
					id: account.id
				}
			},
			relations: {
				repository: true
			},
			order: {
				repository: {
					name: 'desc'
				}
			}
		});
	}

	/**
	 * Finds the collaboration for the given account and repository.
	 *
	 * @param account
	 * @param repositoryId
	 * @returns
	 */
	public getForAccountAndRepository(account: Account, repositoryId: string) {
		if (typeof repositoryId !== 'string') {
			throw new Error('Got a non-string repository ID');
		}

		return this.repository.findOne({
			where: {
				account: {
					id: account.id
				},
				repository: {
					id: repositoryId
				}
			},
			relations: {
				repository: true
			}
		});
	}

	/**
	 * Creates a new collaboration.
	 *
	 * @param repository
	 * @param account
	 * @param role
	 * @param scopes
	 */
	public create(repository: Repository, account: Account, role: CollaborationRole, scopes?: RepositoryScopeId[]) {
		const collab = this.repository.create({
			role,
			scopes: scopes ?? []
		});

		collab.repository = Promise.resolve(repository);
		collab.account = Promise.resolve(account);

		return this.repository.save(collab);
	}

}
