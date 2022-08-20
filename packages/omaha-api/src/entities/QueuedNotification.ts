import { CreateDateColumn } from 'src/support/orm/decorators';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'queued_notifications' })
export class QueuedNotification {

	@PrimaryGeneratedColumn({ unsigned: true })
	public id!: number;

	@Column({ length: 256 })
	public email!: string;

	@Column({ length: 512 })
	public subject!: string;

	@Column({ type: 'mediumtext' })
	public message!: string;

	@CreateDateColumn()
	public created_at!: Date;

}
