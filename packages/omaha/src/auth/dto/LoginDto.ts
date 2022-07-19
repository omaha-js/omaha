import { IsDefined, IsString } from 'class-validator';

export class LoginDto {

	/**
	 * The email address of the user.
	 */
	@IsDefined()
	@IsString()
	email: string;

	/**
	 * The password of the user.
	 */
	@IsDefined()
	@IsString()
	password: string;

}
