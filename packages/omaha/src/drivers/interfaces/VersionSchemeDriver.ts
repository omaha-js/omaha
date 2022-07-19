/**
 * This interface defines a version scheme driver. This driver must implement version string parsing, validation,
 * and sorting for a particular kind of versioning.
 */
export interface VersionSchemeDriver {

	/**
	 * Parses the given input into an object containing version parts for further use with the driver. If the input
	 * is not a valid version string as per the driver's specifications, an error will be thrown.
	 *
	 * @param input
	 * @throws `BadRequestException`
	 */
	parseVersionString(input: string): VersionParseResult;

	/**
	 * Converts a parsed `VersionParseResult` object back into a version string.
	 *
	 * @param parsed
	 */
	getVersionString(parsed: VersionParseResult): string;

}

export interface VersionParseResult {

	/**
	 * The first (major) part of the version string.
	 */
	versionPart1: number;

	/**
	 * The second (minor) part of the version string or `null` if not applicable.
	 */
	versionPart2: number | null;

	/**
	 * The third (patch) part of the version string or `null` if not applicable.
	 */
	versionPart3: number | null;

	/**
	 * The fourth (build) part of the version string or `null` if not applicable.
	 */
	versionPart4: number | null;

	/**
	 * The fifth (prerelease metadata) part of the version string or `null` if not applicable.
	 */
	versionMeta: string | null;

	/**
	 * The sixth (build metadata) part of the version string or `null` if not applicable.
	 */
	versionBuildMeta: string | null;

}
