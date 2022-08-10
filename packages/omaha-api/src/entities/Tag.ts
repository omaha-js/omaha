import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Release } from './Release';
import { Repository } from './Repository';

@Entity({ name: 'tags' })
@Unique([ 'repository', 'name' ])
export class Tag {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id!: number;

	@ManyToOne(() => Repository, repo => repo.tags, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	public repository!: Promise<Repository>;

	@Column({ length: 32 })
	public name!: string;

	@Column({ length: 2048, default: '' })
	public description!: string;

	@CreateDateColumn()
	public created_at!: Date;

	@UpdateDateColumn()
	public updated_at!: Date;

	@ManyToMany(() => Release)
	public releases!: Promise<Release[]>;

}
