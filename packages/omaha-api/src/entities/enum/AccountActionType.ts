/**
 * Defines the secure actions that can be performed on an account using email authentication.
 */
export enum AccountActionType {

	/**
	 * Resets the account's password.
	 */
	ResetPassword = 'reset_password',

	/**
	 * Confirms the account's email address.
	 */
	ConfirmEmail = 'confirm_email',

}
