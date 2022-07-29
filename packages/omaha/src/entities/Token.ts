import { Exclude, Transform } from 'class-transformer';
import { AuthScopeId } from 'src/auth/auth.scopes';
import { TokenType } from 'src/auth/tokens/tokens.types';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Account } from './Account';
import { Repository } from './Repository';

@Entity({ name: 'tokens' })
export class Token {

	@PrimaryColumn({ type: 'binary', length: 8 })
	@Transform(params => params.value.toString('hex'))
	public id: Buffer;

	@Column({ length: 64 })
	public name: string;

	@Column({ type: 'text' })
	public description: string;

	@Column({ nullable: true, default: null })
	@Index()
	public expiration: Date | null;

	@Column({ type: 'binary', length: 48 })
	@Exclude()
	public hash: Buffer;

	@Column({ type: 'enum', enum: TokenType })
	public type: TokenType;

	@ManyToOne(() => Account, account => account.tokens, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'account_id' })
	public account: Promise<Account | null>;

	@ManyToOne(() => Repository, repository => repository.tokens, { nullable: true, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'repository_id' })
	public repository: Promise<Repository | null>;

	@Column({ type: 'json' })
	public scopes: AuthScopeId[];

	@CreateDateColumn()
	public created_at: Date;

	@UpdateDateColumn()
	public updated_at: Date;

}
