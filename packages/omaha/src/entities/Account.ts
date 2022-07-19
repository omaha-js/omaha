import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Collaboration } from './Collaboration';

@Entity({ name: 'accounts' })
export class Account {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id: number;

	@Column({ length: 32 })
	public name: string;

	@Column()
	@Index({ unique: true })
	public email: string;

	@Column()
	@Exclude()
	public password: string;

	@Column({ default: false })
	public verified: boolean;

	@Column({ nullable: true, default: null })
	@Exclude()
	public online_at: Date;

	@CreateDateColumn()
	public created_at: Date;

	@UpdateDateColumn()
	public updated_at: number;

	@OneToMany(() => Collaboration, collab => collab.account)
	public collaborations: Promise<Collaboration[]>;

}
