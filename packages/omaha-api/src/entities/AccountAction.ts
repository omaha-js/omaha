import { CreateDateColumn, DateColumn } from 'src/support/orm/decorators';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Account } from './Account';
import { AccountActionType } from './enum/AccountActionType';

/**
 * An account action token is used to authenticate the identity of an account holder through their email address. It
 * leverages the same security standards as access tokens, but can only be used once.
 */
@Entity({ name: 'account_actions' })
@Index(['account', 'type'])
export class AccountAction<T = any> {

	@PrimaryColumn({ type: 'binary', length: 5 })
	public id!: Buffer;

	@Column({ type: 'binary', length: 48 })
	public hash!: Buffer;

	@Column({ type: 'enum', enum: AccountActionType })
	public type!: AccountActionType;

	@Column({ type: 'json' })
	public metadata!: T;

	@ManyToOne(() => Account, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'account_id' })
	public account!: Account;

	@CreateDateColumn()
	public created_at!: Date;

	@DateColumn()
	@Index()
	public expires_at!: Date;

}
