/**
 * This interface defines a version scheme driver. This driver must implement version string parsing, validation,
 * and sorting for a particular kind of versioning.
 */
export interface VersionSchemeDriver {

	/**
	 * Validates the given version string. Returns the validated (and/or reformatted) string if valid, or throws an
	 * error otherwise.
	 *
	 * @param input
	 * @throws BadRequestException
	 */
	validateVersionString(input: string): string;

	/**
	 * Filters the given array of versions and returns a new array containing all versions that fit the given
	 * constraint in their original orders. Note that the `versions` array will always be sorted by ID in ascending
	 * order.
	 *
	 * @param versions
	 * @param constraint
	 */
	getVersionsFromConstraint(versions: string[], constraint: string): string[];

	/**
	 * Returns a new array of all given versions sorted in the specified direction. Note that the `versions` array will
	 * always be sorted by ID in ascending order.
	 *
	 * @param versions
	 * @param direction
	 */
	getVersionsSorted(versions: string[], direction: 'asc' | 'desc'): string[];

}
