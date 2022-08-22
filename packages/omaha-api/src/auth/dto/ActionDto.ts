import { IsDefined, IsString } from 'class-validator';

export class ActionDto {

	/**
	 * The action token.
	 */
	@IsDefined()
	@IsString()
	token!: string;

}
