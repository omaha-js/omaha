export enum RepoAccess {

	/**
	 * Private repositories cannot be accessed without a valid token.
	 */
	Private = 'private',

	/**
	 * Public repositories can be read without any authentication.
	 */
	Public = 'public',

}

export enum RepoVersionScheme {

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
	Calendar = 'calendar',

	/**
	 * For repositories that use Microsoft versioning. This behaves similarly to semantic versioning, except it has
	 * four parts, with the last part being the "revision".
	 */
	Microsoft = 'microsoft',

	/**
	 * For repositories that use incremental versioning. Version numbers are a single incrementing number and are
	 * sorted in ascending order.
	 */
	Incremental = 'incremental',

	/**
	 * For repositories that use rolling versioning. Versions can be in any format with this scheme because only the
	 * latest release is stored. When checking for updates, the version is compared with a simple equality operation.
	 */
	Rolling = 'rolling',

}
