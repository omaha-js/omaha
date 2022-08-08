import { IsDefined, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Length, MinLength } from 'class-validator';

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

	/**
	 * The invitation ID if applicable. The new account will automatically accept the invitation.
	 */
	@IsOptional()
	@IsUUID()
	invitation?: string;

	/**
	 * The hashed token for the invitation (optional). When provided, it can be used to automatically verify the new
	 * account's email address if it matches the invitation.
	 */
	@IsOptional()
	@IsString()
	@Length(40, 40)
	invitationToken?: string;

}
