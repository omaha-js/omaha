import { RepositoryAccessType } from 'src/entities/enum/RepositoryAccessType';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinTable, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Collaboration } from './Collaboration';
import { Release } from './Release';
import { Asset } from './Asset';
import { Tag } from './Tag';
import { VersionSchemeDriver } from 'src/drivers/interfaces/VersionSchemeDriver';
import { VersionSchemeDrivers } from 'src/drivers/versions';
import { Expose, Transform } from 'class-transformer';
import { Token } from './Token';
import { ReleaseDownload } from './ReleaseDownload';
import { RepositoryVersionScheme } from './enum/RepositoryVersionScheme';
import { RepositorySettingsObject } from 'src/repositories/settings/RepositorySettings';
import { RepositorySettingsManager } from 'src/repositories/settings/RepositorySettingsManager';

@Entity({ name: 'repositories' })
export class Repository {

	@PrimaryGeneratedColumn('uuid')
	public id: string;

	@Column({ length: 64 })
	public name: string;

	@Column({ type: 'text' })
	public description: string;

	@Column({ type: 'enum', enum: RepositoryVersionScheme })
	public scheme: RepositoryVersionScheme;

	@Column({ type: 'enum', enum: RepositoryAccessType })
	public access: RepositoryAccessType;

	@CreateDateColumn()
	public created_at: Date;

	@UpdateDateColumn()
	public updated_at: Date;

	@DeleteDateColumn()
	@Index()
	public deleted_at?: Date;

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

	@OneToMany(() => Token, token => token.repository)
	public tokens: Promise<Token[]>;

	@Column({ type: 'json' })
	@Transform(o => RepositorySettingsManager.transform(o.value))
	public settings: Partial<RepositorySettingsObject>;

	/**
	 * The downloads for this repository.
	 */
	@OneToMany(() => ReleaseDownload, download => download.repository)
	@JoinTable()
	public downloads: Promise<ReleaseDownload[]>;

	/**
	 * The version driver for this repository.
	 */
	public get driver(): VersionSchemeDriver {
		return VersionSchemeDrivers[this.scheme];
	}

}
