import { RepoAccess, RepoVersionScheme } from 'src/repositories/repositories.types';
import { Column, CreateDateColumn, Entity, JoinTable, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Collaboration } from './Collaboration';
import { Release } from './Release';
import { Asset } from './Asset';
import { Tag } from './Tag';
import { VersionSchemeDriver } from 'src/drivers/interfaces/VersionSchemeDriver';
import { VersionSchemeDrivers } from 'src/drivers/versions';
import { Expose } from 'class-transformer';

@Entity({ name: 'repositories' })
export class Repository {

	@PrimaryGeneratedColumn('uuid')
	public id: string;

	@Column({ length: 64 })
	public name: string;

	@Column({ type: 'text' })
	public description: string;

	@Column({ type: 'enum', enum: RepoVersionScheme })
	public scheme: RepoVersionScheme;

	@Column({ type: 'enum', enum: RepoAccess })
	public access: RepoAccess;

	@CreateDateColumn()
	public created_at: Date;

	@UpdateDateColumn()
	public updated_at: Date;

	@OneToMany(() => Collaboration, collab => collab.repository)
	@JoinTable()
	public collaborators: Promise<Collaboration[]>;

	@OneToMany(() => Tag, tag => tag.repository)
	@JoinTable()
	public tags: Promise<Tag[]>;

	@OneToMany(() => Asset, asset => asset.repository)
	@JoinTable()
	public assets: Promise<Asset[]>;

	@OneToMany(() => Release, release => release.repository)
	@JoinTable()
	public releases: Promise<Release[]>;

	@Column({ type: 'json' })
	public settings: RepositorySettings;

	/**
	 * The version driver for this repository.
	 */
	public get driver(): VersionSchemeDriver {
		return VersionSchemeDrivers[this.scheme];
	}

	/**
	 * Whether or not the repository's scheme driver reports that it is ready. When false, the user must update the
	 * repository's settings to satisfy the driver.
	 */
	@Expose()
	public get ready() {
		return true;
	}

}

export interface RepositorySettings {
	calver?: {
		format?: string;
	};
}
