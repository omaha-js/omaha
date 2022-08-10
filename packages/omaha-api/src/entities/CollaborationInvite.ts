import { Exclude, Expose } from 'class-transformer';
import { RepositoryScopeId } from 'src/auth/auth.scopes';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { CreateDateColumn, DateColumn } from 'src/support/orm/decorators';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Repository } from './Repository';

@Entity({ name: 'collaboration_invites' })
@Unique([ 'repository', 'email' ])
export class CollaborationInvite {

	@PrimaryGeneratedColumn('uuid')
	public id!: string;

	@ManyToOne(() => Repository, repo => repo.collaborators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'repository_id' })
	@Exclude()
	public repository!: Promise<Repository>;

	@Column()
	public email!: string;

	@Column({ type: 'enum', enum: CollaborationRole })
	public role!: CollaborationRole;

	@Column({ type: 'json' })
	public scopes!: RepositoryScopeId[];

	@CreateDateColumn()
	public created_at!: Date;

	@DateColumn()
	@Index()
	public expires_at!: Date;

	@Expose({ name: 'repository' })
	public get jsonPropRepository() {
		return (this as any).__repository__;
	}

}
