import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Release } from './Release';

@Entity({ name: 'release_jobs' })
export class ReleaseJob {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id!: number;

	@ManyToOne(() => Release, release => release.queue, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'release_id' })
	public release!: Promise<Release>;

	@Column({ length: 64 })
	public name!: string;

	@Column({ type: 'json', default: null })
	@Exclude()
	public data!: any;

	@Column({ type: 'bool', default: false })
	public is_error!: boolean;

	@CreateDateColumn()
	public created_at!: Date;

}
