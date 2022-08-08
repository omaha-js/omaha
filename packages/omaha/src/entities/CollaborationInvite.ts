import { Exclude, Expose } from 'class-transformer';
import { RepositoryScopeId } from 'src/auth/auth.scopes';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Repository } from './Repository';

@Entity({ name: 'collaboration_invites' })
@Unique([ 'repository', 'email' ])
export class CollaborationInvite {

	@PrimaryGeneratedColumn('uuid')
	public id: string;

	@ManyToOne(() => Repository, repo => repo.collaborators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'repository_id' })
	@Exclude()
	public repository: Promise<Repository>;

	@Column()
	public email: string;

	@Column({ type: 'enum', enum: CollaborationRole })
	public role: CollaborationRole;

	@Column({ type: 'json' })
	public scopes: RepositoryScopeId[];

	@CreateDateColumn()
	public created_at: Date;

	@Column({ type: 'datetime', precision: 6 })
	@Index()
	public expires_at: Date;

	@Expose({ name: 'repository' })
	public get jsonRepositoryProp() {
		return (this as any).__repository__;
	}

}
