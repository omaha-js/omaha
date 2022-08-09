/**
 * Defines what type of entity (account, repository) a token should grant scopes and access for.
 */
export enum TokenType {

	/**
	 * Tokens that belong to an entire account.
	 */
	Account = 'account',

	/**
	 * Tokens that belong to a specific repository.
	 */
	Repository = 'repository',

}
