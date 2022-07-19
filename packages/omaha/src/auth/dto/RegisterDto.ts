import { IsDefined, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {

	/**
	 * The name of the user.
	 */
	@IsDefined()
	@IsNotEmpty()
	name: string;

	/**
	 * The email address of the user.
	 */
	@IsDefined()
	@IsNotEmpty()
	@IsEmail()
	email: string;

	/**
	 * The password of the user.
	 */
	@IsDefined()
	@IsNotEmpty()
	@MinLength(8)
	password: string;

}
