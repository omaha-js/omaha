import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Repository } from './Repository';

@Entity({ name: 'assets' })
@Unique([ 'repository', 'name' ])
export class Asset {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id: number;

	@ManyToOne(() => Repository, repo => repo.assets, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	public repository: Promise<Repository>;

	@Column({ length: 32 })
	public name: string;

	@Column({ length: 2048, default: '' })
	public description: string;

	@Column({ type: 'boolean' })
	public required: boolean;

	@CreateDateColumn()
	public created_at: Date;

	@UpdateDateColumn()
	public updated_at: Date;

}
