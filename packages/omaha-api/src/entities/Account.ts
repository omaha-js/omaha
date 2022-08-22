import { Exclude, Expose } from 'class-transformer';
import { Environment } from 'src/app.environment';
import { NotificationId } from 'src/notifications/notifications.types';
import { CreateDateColumn, UpdateDateColumn } from 'src/support/orm/decorators';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Collaboration } from './Collaboration';
import { Token } from './Token';

@Entity({ name: 'accounts' })
export class Account {

	@PrimaryGeneratedColumn({ unsigned: true })
	@Exclude()
	public id!: number;

	@Column({ length: 32 })
	public name!: string;

	@Column()
	@Index({ unique: true })
	public email!: string;

	@Column()
	@Exclude()
	public password!: string;

	@Column({ type: 'json' })
	@Exclude()
	public notifications!: NotificationId[];

	@Column({ default: false })
	@Exclude()
	public verified!: boolean;

	@CreateDateColumn()
	public created_at!: Date;

	@UpdateDateColumn()
	public updated_at!: Date;

	@OneToMany(() => Collaboration, collab => collab.account)
	public collaborations!: Promise<Collaboration[]>;

	@OneToMany(() => Token, token => token.account)
	public tokens!: Promise<Token[]>;

	/**
	 * Returns `true` if this account needs to be verified, considering whether both verification and emails ending is
	 * enabled on the system.
	 */
	public get verification_required() {
		return !this.verified && Environment.SMTP_HOST && Environment.REQUIRE_EMAIL_VERIFICATION;
	}

	@Expose({ name: 'verified' })
	protected get jsonPropVerified() {
		return !this.verification_required;
	}

}
