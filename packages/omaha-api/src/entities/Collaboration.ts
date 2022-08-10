import { ForbiddenException } from '@nestjs/common';
import { Exclude, Expose } from 'class-transformer';
import { RepositoryScopeId, RepositoryScopes } from 'src/auth/auth.scopes';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { TokenCollaboration } from 'src/repositories/collaborations/collaborations.service';
import { CreateDateColumn, UpdateDateColumn } from 'src/support/orm/decorators';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

	@PrimaryGeneratedColumn('uuid')
	public id!: string;

	@ManyToOne(() => Repository, repo => repo.collaborators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'repository_id' })
	@Exclude()
	public repository!: Promise<Repository>;

	@ManyToOne(() => Account, account => account.collaborations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'account_id' })
	@Exclude()
	public account!: Promise<Account>;

	@Column({ type: 'enum', enum: CollaborationRole })
	public role!: CollaborationRole;

	@Column({ type: 'json' })
	@Exclude()
	public scopes!: RepositoryScopeId[];

	@CreateDateColumn()
	public created_at!: Date;

	@UpdateDateColumn()
	public updated_at!: Date;

	@Expose({ name: 'scopes' })
	public getFullScopes(): RepositoryScopeId[] {
		if (this.role !== CollaborationRole.Custom) {
			const scopes = new Array<RepositoryScopeId>();

			for (const scope of RepositoryScopes) {
				const groups: CollaborationRole[] = scope.groups as any;

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

	/**
	 * Throws an error if the collaboration does not have the specified permission.
	 *
	 * @param scope
	 */
	public requirePermission(scope: RepositoryScopeId) {
		if (!this.hasPermission(scope)) {
			throw new ForbiddenException('You do not have privileges to access this endpoint');
		}
	}

	@Expose({ name: 'account' })
	public get jsonPropAccount() {
		return (this as any).__account__;
	}

}
