import { Exclude, Expose } from 'class-transformer';
import { CreateDateColumn } from 'src/support/orm/decorators';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Release } from './Release';
import { ReleaseAttachment } from './ReleaseAttachment';
import { Repository } from './Repository';
import { Token } from './Token';

@Entity({ name: 'release_downloads' })
@Index(['attachment', 'date'])
@Index(['release', 'date'])
@Index(['repository', 'date'])
export class ReleaseDownload {

	@PrimaryGeneratedColumn({ unsigned: true })
	public id!: number;

	@ManyToOne(() => ReleaseAttachment, attachment => attachment.downloads, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'attachment_id' })
	@Index()
	public attachment!: Promise<ReleaseAttachment>;

	@ManyToOne(() => Release, release => release.downloads, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'release_id' })
	@Index()
	public release!: Promise<Release>;

	@ManyToOne(() => Repository, repo => repo.downloads, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	@Index()
	public repository!: Promise<Repository>;

	@ManyToOne(() => Token, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'token_id' })
	public token!: Token | null;

	@Column({ type: 'varchar', length: 45 })
	public ip!: string;

	@Column({ type: 'date' })
	@Index()
	@Exclude()
	public date!: Date;

	@CreateDateColumn()
	@Index()
	public time!: Date;

	@Expose({ name: 'release' })
	protected get jsonPropRelease() {
		return (this as any).__release__;
	}

	@Expose({ name: 'attachment' })
	protected get jsonPropAttachment() {
		return (this as any).__attachment__;
	}

}
