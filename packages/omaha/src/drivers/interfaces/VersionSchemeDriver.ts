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
	 * Filters the given versions and returns a new array containing all versions that fit the given constraint. The
	 * order of the returned versions does not matter.
	 *
	 * @param versions
	 * @param constraint
	 */
	getVersionsFromConstraint(versions: VersionList, constraint: string): string[];

	/**
	 * Returns a new array of all given versions sorted in the specified direction.
	 *
	 * @param versions
	 * @param direction
	 */
	getVersionsSorted(versions: VersionList, direction: 'asc' | 'desc'): string[];

}

export interface VersionList {
	/**
	 * A list of all versions in the repository, sorted by ID in ascending order. This may not be useful to drivers but
	 * is made available for edge cases.
	 */
	all: string[];

	/**
	 * A list of all versions that are being considered for the current query. Order is not guaranteed. This is
	 * primarily what drivers should work with.
	 */
	selected: string[];
}
