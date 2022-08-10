import { Exclude, Expose } from 'class-transformer';
import { CreateDateColumn, DateColumn, UpdateDateColumn } from 'src/support/orm/decorators';
import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ReleaseStatus } from './enum/ReleaseStatus';
import { ReleaseAttachment } from './ReleaseAttachment';
import { ReleaseDownload } from './ReleaseDownload';
import { ReleaseJob } from './ReleaseJob';
import { Repository } from './Repository';
import { Tag } from './Tag';

@Entity({ name: 'releases' })
@Unique([ 'repository', 'version' ])
@Index(['status', 'purged_at'])
export class Release {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id!: number;

	@ManyToOne(() => Repository, repo => repo.releases, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	public repository!: Promise<Repository>;

	/**
	 * The version string as provided from user input.
	 */
	@Column()
	public version!: string;

	/**
	 * The current status of the release.
	 */
	@Column({ type: 'enum', enum: ReleaseStatus, default: 'draft' })
	public status!: ReleaseStatus;

	/**
	 * The description of the release in markdown format, often used as a changelog.
	 */
	@Column({ type: 'longtext' })
	public description!: string;

	/**
	 * The number of times the release was downloaded.
	 */
	@Column({ unsigned: true, default: 0 })
	public download_count!: number;

	/**
	 * The time when this release was created.
	 */
	@CreateDateColumn()
	public created_at!: Date;

	/**
	 * The time when this release was last updated.
	 */
	@UpdateDateColumn()
	public updated_at!: Date;

	/**
	 * The time when this release was published (or `null` if it's still a draft).
	 */
	@DateColumn({ default: null })
	public published_at!: Date | null;

	/**
	 * The time when this release was archived (or `null` if it's in another state).
	 */
	@DateColumn({ default: null })
	public archived_at!: Date | null;

	/**
	 * The time when this release was purged (meaning its files have been removed from storage).
	 */
	@DateColumn({ default: null })
	public purged_at!: Date | null;

	/**
	 * The tags that this release is assigned to.
	 */
	@ManyToMany(() => Tag)
	@JoinTable({
		name: 'releases_to_tags',
		joinColumn: { name: 'release_id' },
		inverseJoinColumn: { name: 'tag_id' }
	})
	public tags!: Promise<Tag[]>;

	/**
	 * The uploads for this release.
	 */
	@OneToMany(() => ReleaseAttachment, attachment => attachment.release)
	public attachments!: Promise<ReleaseAttachment[]>;

	/**
	 * The queued jobs for this release.
	 */
	@OneToMany(() => ReleaseJob, job => job.release)
	public queue!: Promise<ReleaseJob[]>;

	/**
	 * The downloads for this release.
	 */
	@OneToMany(() => ReleaseDownload, download => download.release)
	@JoinTable()
	public downloads!: Promise<ReleaseDownload[]>;

	/**
	 * The names of the tags that this release is assigned to. Requires the tags to have already been loaded.
	 */
	@Expose({ name: 'tags' })
	public get jsonPropTags() {
		const tags: Tag[] = (this as any).__tags__;
		if (!tags) return;
		return tags.map(tag => tag.name);
	}

	/**
	 * The names of the tags that this release is assigned to. Requires the tags to have already been loaded.
	 */
	@Expose({ name: 'attachments' })
	public get jsonPropAttachments() {
		return (this as any).__attachments__;
	}

}
