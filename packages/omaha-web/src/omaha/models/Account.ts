import { Type } from 'class-transformer';

export class Account {
	name: string;
	email: string;
	verified: boolean;

	@Type(() => Date)
	created_at: Date;

	@Type(() => Date)
	updated_at: Date;
}
