/**
 * Defines the access type (public, private) of a repository.
 */
export enum RepositoryAccessType {

	/**
	 * Private repositories cannot be accessed without a valid token.
	 */
	Private = 'private',

	/**
	 * Public repositories can be read without any authentication.
	 */
	Public = 'public',

}
