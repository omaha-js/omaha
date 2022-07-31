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
	public id: number;

	@ManyToOne(() => ReleaseAttachment, attachment => attachment.downloads, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'attachment_id' })
	@Index()
	public attachment: Promise<ReleaseAttachment>;

	@ManyToOne(() => Release, release => release.downloads, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'release_id' })
	@Index()
	public release: Promise<Release>;

	@ManyToOne(() => Repository, repo => repo.downloads, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	@Index()
	public repository: Promise<Repository>;

	@ManyToOne(() => Token, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'token_id' })
	public token: Token;

	@Column({ type: 'varchar', length: 45 })
	public ip: string;

	@Column({ type: 'date' })
	@Index()
	public date: Date;

	@Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
	@Index()
	public time: Date;

}
