import { Exclude, Expose, Transform } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn } from 'src/support/orm/decorators';
import { Column, Entity, Index, JoinColumn, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Asset } from './Asset';
import { ReleaseAttachmentStatus } from './enum/ReleaseAttachmentStatus';
import { Release } from './Release';
import { ReleaseDownload } from './ReleaseDownload';

@Entity({ name: 'release_attachments' })
@Unique([ 'release', 'asset' ])
export class ReleaseAttachment {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id!: number;

	/**
	 * The release that this asset is for.
	 */
	@ManyToOne(() => Release, release => release.attachments, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'release_id' })
	public release!: Promise<Release>;

	/**
	 * The asset that this row represents for the release.
	 */
	@ManyToOne(() => Asset, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'asset_id' })
	@Transform(asset => (asset.value as Asset).name)
	public asset!: Asset;

	/**
	 * The name of the file as it will be downloaded.
	 */
	@Column({ length: 256 })
	public file_name!: string;

	/**
	 * The name of the file within the storage system. This does not include the directory or path to the file, which
	 * will be the repository's unique ID.
	 */
	@Column({ type: 'varchar', length: 256, default: null })
	@Exclude()
	public object_name!: string | null;

	/**
	 * The mime type of the file.
	 */
	@Column({ length: 64 })
	public mime!: string;

	/**
	 * The effective size of the file in storage.
	 */
	@Column({ unsigned: true })
	public size!: number;

	/**
	 * The status of the file upload into storage.
	 */
	@Column({ type: 'enum', enum: ReleaseAttachmentStatus, default: ReleaseAttachmentStatus.Pending })
	@Index()
	public status!: ReleaseAttachmentStatus;

	/**
	 * The SHA-1 digest hash for the file's contents.
	 */
	@Column({ type: 'binary', length: 20 })
	@Transform(params => params.value.toString('hex'))
	public hash_sha1!: Buffer;

	/**
	 * The MD5 digest hash for the file's contents.
	 */
	@Column({ type: 'binary', length: 16 })
	@Transform(params => params.value.toString('hex'))
	public hash_md5!: Buffer;

	/**
	 * The number of times the attachment was downloaded.
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
	 * The downloads for this attachment.
	 */
	@OneToMany(() => ReleaseDownload, download => download.attachment)
	@JoinTable()
	public downloads!: Promise<ReleaseDownload[]>;

	/**
	 * The underlying release.
	 */
	@Expose({ name: 'release', groups: ['ws'] })
	public get jsonPropRelease() {
		return (this as any).__release__;
	}

}
