/**
 * Defines the versioning scheme to use for releases within a repository.
 */
export enum RepositoryVersionScheme {

	/**
	 * For repositories that use semantic versioning.
	 *
	 * @see https://semver.org/
	 */
	Semantic = 'semantic',

	/**
	 * For repositories that use calendar versioning. Behind the scenes, this behaves identically to semantic
	 * versioning, however discerning between them allows for calendar-specific options to be added later.
	 *
	 * @see https://calver.org/
	 */
	// Calendar = 'calendar',

	/**
	 * For repositories that use Microsoft versioning. This behaves similarly to semantic versioning, except it has
	 * four parts, with the last part being the "revision".
	 */
	Microsoft = 'microsoft',

	/**
	 * For repositories that use incremental versioning. Version numbers are a single incrementing number and can be
	 * optionally masked behind a random SHA-256 hash.
	 */
	Incremental = 'incremental'

}
