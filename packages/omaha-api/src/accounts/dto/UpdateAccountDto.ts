import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class UpdateAccountDto {

	/**
	 * The name of the user.
	 */
	@IsNotEmpty()
	@IsOptional()
	name?: string;

	/**
	 * The email address of the user.
	 */
	@IsEmail()
	@IsNotEmpty()
	@IsOptional()
	email?: string;

	/**
	 * The password of the user.
	 */
	@MinLength(8)
	@IsNotEmpty()
	@IsOptional()
	password?: string;

	/**
	 * The current password for the user – only required when changing email or password.
	 */
	@IsNotEmpty()
	@IsOptional()
	existingPassword?: string;

}
