import { Exclude, Expose, Transform } from 'class-transformer';
import { AuthScopeId } from 'src/auth/auth.scopes';
import { TokenType } from 'src/entities/enum/TokenType';
import { CreateDateColumn, DateColumn, DeleteDateColumn, UpdateDateColumn } from 'src/support/orm/decorators';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Account } from './Account';
import { Repository } from './Repository';

@Entity({ name: 'tokens' })
export class Token {

	@PrimaryColumn({ type: 'binary', length: 5 })
	@Transform(params => params.value.toString('hex'))
	public id!: Buffer;

	@Column({ length: 64 })
	public name!: string;

	@Column({ length: 2048, default: '' })
	public description!: string;

	@Column({ type: 'binary', length: 48 })
	@Exclude()
	public hash!: Buffer;

	@Column({ type: 'enum', enum: TokenType })
	public type!: TokenType;

	@ManyToOne(() => Account, account => account.tokens, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'account_id' })
	public account!: Promise<Account | null>;

	@ManyToOne(() => Repository, repository => repository.tokens, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	public repository!: Promise<Repository | null>;

	@Column({ type: 'json' })
	public scopes!: AuthScopeId[];

	@DateColumn({ nullable: true, default: null })
	@Index()
	public expires_at!: Date | null;

	@CreateDateColumn()
	public created_at!: Date;

	@UpdateDateColumn()
	public updated_at!: Date;

	@DeleteDateColumn()
	@Exclude()
	public deleted_at!: Date | null;

	@Expose({ name: 'deleted_at' })
	protected get jsonPropDeletedAt() {
		if ((this as any).deleted_at) {
			return (this as any).deleted_at;
		}
	}

}
