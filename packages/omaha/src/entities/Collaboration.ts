import { Exclude, Expose } from 'class-transformer';
import { RepositoryScopeId, RepositoryScopes } from 'src/auth/auth.scopes';
import { CollaboratorRole } from 'src/repositories/collaborations/collaborations.types';
import { TokenCollaboration } from 'src/repositories/repositories.guard';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './Account';
import { Repository } from './Repository';

@Entity({ name: 'collaborations' })
export class Collaboration {

	/**
	 * Returns true if this collaboration is generated ephemerally from a token.
	 * @returns
	 */
	public isToken(): this is TokenCollaboration {
		return false;
	}

	@PrimaryGeneratedColumn({ unsigned: true })
	@Expose({ groups: ['id'] })
	public id: number;

	@ManyToOne(() => Repository, repo => repo.collaborators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'repository_id' })
	@Exclude()
	public repository: Promise<Repository>;

	@ManyToOne(() => Account, account => account.collaborations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'account_id' })
	@Exclude()
	public account: Promise<Account>;

	@Column({ type: 'enum', enum: CollaboratorRole })
	public role: CollaboratorRole;

	@Column({ type: 'json' })
	@Exclude()
	public scopes: RepositoryScopeId[];

	@CreateDateColumn()
	public created_at: Date;

	@UpdateDateColumn()
	public updated_at: Date;

	@Expose({ name: 'scopes' })
	public getFullScopes(): RepositoryScopeId[] {
		if (this.role !== CollaboratorRole.Custom) {
			const scopes = [];

			for (const scope of RepositoryScopes) {
				const groups: CollaboratorRole[] = scope.groups as any;

				if (groups.includes(this.role)) {
					scopes.push(scope.id);
				}
			}

			return scopes;
		}

		return this.scopes;
	}

	/**
	 * Returns true if the collaboration has the specified permission.
	 *
	 * @param scope
	 */
	public hasPermission(scope: RepositoryScopeId) {
		return (this.getFullScopes().includes(scope));
	}

}
