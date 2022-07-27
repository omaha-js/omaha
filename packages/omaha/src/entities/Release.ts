import { Exclude, Expose } from 'class-transformer';
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ReleaseAsset } from './ReleaseAsset';
import { Repository } from './Repository';
import { Tag } from './Tag';

@Entity({ name: 'releases' })
@Unique([ 'repository', 'version' ])
export class Release {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id: number;

	@ManyToOne(() => Repository, repo => repo.releases, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	public repository: Promise<Repository>;

	/**
	 * The version string as provided from user input.
	 */
	@Column()
	public version: string;

	/**
	 * Whether or not this release is a draft.
	 */
	@Column({ default: true })
	public draft: boolean;

	/**
	 * The description of the release in markdown format, often used as a changelog.
	 */
	@Column({ type: 'longtext' })
	public description: string;

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

	/**
	 * The time when this release was published (or `null` if it's still a draft).
	 */
	@Column({ precision: 6, nullable: true, default: null })
	public published_at: Date | null;

	/**
	 * The tags that this release is assigned to.
	 */
	@ManyToMany(() => Tag)
	@JoinTable({
		name: 'releases_to_tags',
		joinColumn: { name: 'release_id' },
		inverseJoinColumn: { name: 'tag_id' }
	})
	public tags: Promise<Tag[]>;

	/**
	 * The asset uploads for this release.
	 */
	@OneToMany(() => ReleaseAsset, asset => asset.release)
	public assets: Promise<ReleaseAsset[]>;

	/**
	 * The names of the tags that this release is assigned to. Requires the tags to have already been loaded.
	 */
	@Expose({ name: 'tags' })
	public get jsonTagsProp() {
		const tags: Tag[] = (this as any).__tags__ ?? [];
		return tags.map(tag => tag.name);
	}

	/**
	 * The names of the tags that this release is assigned to. Requires the tags to have already been loaded.
	 */
	@Expose({ name: 'assets' })
	public get jsonAssetsProp() {
		const assets: Tag[] = (this as any).__assets__;
		if (!assets) return;
		return assets;
	}

}
