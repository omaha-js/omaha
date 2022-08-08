import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Environment } from 'src/app.environment';
import { RepositoryScopeId } from 'src/auth/auth.scopes';
import { EmailService } from 'src/email/email.service';
import { Account } from 'src/entities/Account';
import { Collaboration } from 'src/entities/Collaboration';
import { CollaborationInvite } from 'src/entities/CollaborationInvite';
import { Repository } from 'src/entities/Repository';
import { Repository as TypeOrmRepository } from 'typeorm';
import { CollaborationRole } from '../../entities/enum/CollaborationRole';
import crypto from 'crypto';
import { BaseToken, TokenForRepository } from 'src/auth/tokens/models/BaseToken';
import { DatabaseToken } from 'src/auth/tokens/models/DatabaseToken';

@Injectable()
export class CollaborationsService {

	public constructor(
		@InjectRepository(Collaboration) private readonly collaborations: TypeOrmRepository<Collaboration>,
		@InjectRepository(CollaborationInvite) private readonly invites: TypeOrmRepository<CollaborationInvite>,
		private readonly email: EmailService,
	) {}

	/**
	 * Finds all collaborations for the given account.
	 *
	 * @param account
	 * @returns
	 */
	public getForAccount(account: Account) {
		return this.collaborations.find({
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
	 * @param repository
	 * @returns
	 */
	public getForAccountAndRepository(account: Account, repository: string | Repository) {
		if (typeof repository !== 'string') {
			repository = repository.id;
		}

		return this.collaborations.findOne({
			where: {
				account: {
					id: account.id
				},
				repository: {
					id: repository
				}
			},
			relations: {
				repository: true
			}
		});
	}

	/**
	 * Gets all collaborations for a repository.
	 *
	 * @param repository
	 * @returns
	 */
	public getForRepository(repository: string | Repository) {
		if (typeof repository !== 'string') {
			repository = repository.id;
		}

		return this.collaborations.find({
			where: {
				repository: {
					id: repository
				}
			},
			relations: {
				account: true
			},
			order: {
				id: 'asc'
			}
		});
	}

	/**
	 * Returns an array of collaborations for the given token. Depending on the type of token, more than one
	 * collaboration could be returned.
	 *
	 * Note that collaborations for repository-based tokens are created in-memory and are not full instances (only the
	 * `scopes` and `role` properties are set).
	 *
	 * @param token
	 * @returns
	 */
	public async getForToken(token: BaseToken): Promise<Collaboration[]> {
		if (token.isForAccount()) {
			return this.getForAccount(token.account);
		}
		else if (token.isForRepository()) {
			const collaboration = new TokenCollaboration(token);

			collaboration.scopes = token.scopes as any;
			collaboration.role = CollaborationRole.Custom;
			collaboration.repository = Promise.resolve(token.repository);

			return [collaboration];
		}
	}

	/**
	 * Gets all collaboration invites for a repository.
	 *
	 * @param repository
	 * @returns
	 */
	public getInvitesForRepository(repository: string | Repository) {
		if (typeof repository !== 'string') {
			repository = repository.id;
		}

		return this.invites.find({
			where: {
				repository: {
					id: repository
				}
			},
			order: {
				id: 'asc'
			}
		});
	}

	/**
	 * Gets a specific collaboration invite for a repository based on its email.
	 *
	 * @param repository
	 * @param email
	 * @returns
	 */
	public getInviteForRepositoryAndEmail(repository: string | Repository, email: string) {
		if (typeof repository !== 'string') {
			repository = repository.id;
		}

		return this.invites.findOne({
			where: {
				email,
				repository: {
					id: repository
				}
			}
		});
	}

	/**
	 * Gets a specific collaboration invite.
	 *
	 * @param repository
	 * @param id
	 * @returns
	 */
	public getInviteForRepositoryById(repository: string | Repository, id: string) {
		if (typeof repository !== 'string') {
			repository = repository.id;
		}

		return this.invites.findOne({
			where: {
				id,
				repository: {
					id: repository
				}
			}
		});
	}

	/**
	 * Gets a specific collaboration invite. Dangerous!
	 *
	 * @param id
	 * @returns
	 */
	public getInviteById(id: string) {
		return this.invites.findOne({
			where: {
				id
			}
		});
	}

	/**
	 * Gets a specific collaboration.
	 *
	 * @param repository
	 * @param id
	 * @returns
	 */
	public getForRepositoryById(repository: string | Repository, id: string) {
		if (typeof repository !== 'string') {
			repository = repository.id;
		}

		return this.collaborations.findOne({
			where: {
				id,
				repository: {
					id: repository
				}
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
		const collab = this.collaborations.create({
			role,
			scopes: scopes ?? []
		});

		collab.repository = Promise.resolve(repository);
		collab.account = Promise.resolve(account);

		return this.collaborations.save(collab);
	}

	/**
	 * Creates a new invitation for the given email to become a collaborator.
	 *
	 * @param repository
	 * @param email
	 * @param role
	 * @param scopes
	 */
	public async createInvite(repository: Repository, email: string, role: CollaborationRole, scopes?: RepositoryScopeId[]) {
		if (!this.email.enabled) {
			throw new BadRequestException('Cannot send invite because this server is not configured to send email');
		}

		const expires = new Date();
		expires.setDate(expires.getDate() + 14);

		const invite = this.invites.create({
			email,
			role,
			scopes: scopes ?? [],
			expires_at: expires
		});

		invite.repository = Promise.resolve(repository);
		await this.invites.save(invite);

		const url = new URL(`invitation/${invite.id}`, Environment.APP_URL);
		const payload = Environment.APP_SECRET + invite.id + invite.expires_at.getTime();
		const token = crypto.createHash('sha1').update(payload).digest('hex');

		url.searchParams.append('token', token);

		try {
			await this.email.send({
				to: email,
				subject: `New invitation to collaborate on ${repository.name}`,
				template: 'collaborator_invitation',
				context: {
					repository,
					link: url.href
				}
			});

			return invite;
		}
		catch (error) {
			await this.invites.delete(invite.id);
			throw new BadRequestException('Failed to send invitation to the specified email address');
		}
	}

	/**
	 * Saves changes to the given invite instance.
	 *
	 * @param invite
	 * @param role
	 * @param scopes
	 * @returns
	 */
	public async updateInvite(invite: CollaborationInvite, role?: CollaborationRole, scopes?: RepositoryScopeId[]) {
		if (invite.role === CollaborationRole.Custom && role !== CollaborationRole.Custom) {
			invite.scopes = [];
		}

		const effectiveRole = role ?? invite.role;
		const effectiveScopes = scopes ?? invite.scopes;

		if (effectiveScopes.length > 0 && effectiveRole !== CollaborationRole.Custom) {
			throw new BadRequestException(`You cannot provide scopes when 'role' does not equal 'custom'`);
		}

		invite.role = effectiveRole;
		invite.scopes = effectiveScopes;

		return this.invites.save(invite);
	}

	/**
	 * Saves changes to the given collaboration instance.
	 *
	 * @param collab
	 * @param role
	 * @param scopes
	 * @returns
	 */
	public async update(collab: Collaboration, role?: CollaborationRole, scopes?: RepositoryScopeId[]) {
		if (collab.role === CollaborationRole.Custom && role !== CollaborationRole.Custom) {
			collab.scopes = [];
		}

		const effectiveRole = role ?? collab.role;
		const effectiveScopes = scopes ?? collab.scopes;

		if (effectiveScopes.length > 0 && effectiveRole !== CollaborationRole.Custom) {
			throw new BadRequestException(`You cannot provide scopes when 'role' does not equal 'custom'`);
		}

		collab.role = effectiveRole;
		collab.scopes = effectiveScopes;

		return this.collaborations.save(collab);
	}

	/**
	 * Deletes the given invite instance.
	 *
	 * @param invite
	 * @returns
	 */
	public async deleteInvite(invite: CollaborationInvite) {
		await this.invites.delete(invite.id);

		return {
			success: true,
			message: 'Invite has been deleted successfully.'
		}
	}

	/**
	 * Deletes the given collaboration instance.
	 *
	 * @param collab
	 * @returns
	 */
	public async delete(collab: Collaboration) {
		await this.collaborations.delete(collab.id);

		return {
			success: true,
			message: 'Collaboration has been deleted successfully.'
		}
	}

}


export class TokenCollaboration extends Collaboration {

	public constructor(public readonly token: TokenForRepository) {
		super();
	}

	public override isToken(): this is TokenCollaboration {
		return true;
	}

}
