import { Exclude, Transform } from 'class-transformer';
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Asset } from './Asset';
import { Release } from './Release';
import { ReleaseDownload } from './ReleaseDownload';

@Entity({ name: 'release_attachments' })
@Unique([ 'release', 'asset' ])
export class ReleaseAttachment {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id: number;

	/**
	 * The release that this asset is for.
	 */
	@ManyToOne(() => Release, release => release.attachments, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'release_id' })
	public release: Promise<Release>;

	/**
	 * The asset that this row represents for the release.
	 */
	@ManyToOne(() => Asset, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'asset_id' })
	@Transform(asset => (asset.value as Asset).name)
	public asset: Asset;

	/**
	 * The name of the file as it will be downloaded.
	 */
	@Column({ length: 256 })
	public file_name: string;

	/**
	 * The name of the file within the storage system. This does not include the directory or path to the file, which
	 * will be the repository's unique ID.
	 */
	@Column({ length: 256 })
	@Exclude()
	public object_name: string;

	/**
	 * The mime type of the file.
	 */
	@Column({ length: 64 })
	public mime: string;

	/**
	 * The effective size of the file in storage.
	 */
	@Column({ unsigned: true })
	public size: number;

	/**
	 * The time when this release was created.
	 */
	@CreateDateColumn()
	public created_at: Date;

	/**
	 * The time when this release was last updated.
	 */
	@UpdateDateColumn()
	public updated_at: Date;

	@OneToMany(() => ReleaseDownload, download => download.attachment)
	@JoinTable()
	public downloads: Promise<ReleaseDownload[]>;

}
