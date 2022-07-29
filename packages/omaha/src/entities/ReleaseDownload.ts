import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReleaseAttachment } from './ReleaseAttachment';
import { Token } from './Token';

@Entity({ name: 'release_downloads' })
@Index(['attachment', 'time'])
export class ReleaseDownload {

	@PrimaryGeneratedColumn({ unsigned: true })
	public id: number;

	@ManyToOne(() => ReleaseAttachment, repo => repo.downloads, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'attachment_id' })
	@Index()
	public attachment: Promise<ReleaseAttachment>;

	@ManyToOne(() => Token, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'token_id' })
	public token: Token;

	@Column({ type: 'varchar', length: 45 })
	public ip: string;

	@Column()
	@Index()
	public time: Date;

}
