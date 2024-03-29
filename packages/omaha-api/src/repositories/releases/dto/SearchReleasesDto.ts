import { IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class SearchReleasesDto {

	/**
	 * The page number of results to show.
	 * @default '1'
	 */
	@IsOptional()
	@IsNumberString()
	@IsNotEmpty()
	page: string = '1';

	/**
	 * The number of results to show per page. This can be set to `0` to show all results when `assets=1`.
	 * @default '25'
	 */
	@IsOptional()
	@IsNumberString()
	@IsNotEmpty()
	count: string = '25';

	/**
	 * Whether or not to include attachments in the results.
	 * @default '0'
	 */
	@IsOptional()
	@IsIn([ 'true', '1', 'false', '0' ])
	include_attachments: 'true' | '1' | 'false' | '0' = '0';

	/**
	 * Whether or not to include 7-day download statistics in the results.
	 * @default '0'
	 */
	@IsOptional()
	@IsIn([ 'true', '1', 'false', '0' ])
	include_downloads: 'true' | '1' | 'false' | '0' = '0';

	/**
	 * Search for a version. This can be an exact version number, a version constraint (based on the driver used for
	 * the repository), or tag name, and is checked in that order.
	 * @default undefined
	 */
	@IsOptional()
	@IsString()
	constraint?: string;

	/**
	 * A comma-delimited list of release tags to include. When not specified or blank, all tags are included.
	 * @default '' // (all)
	 */
	@IsOptional()
	@IsString()
	tags: string = '';

	/**
	 * A comma-delimited list of assets to look for. When multiple assets are defined, releases that match any of them
	 * will be included in the results.
	 * @default '' // (all)
	 */
	@IsOptional()
	@IsString()
	assets: string = '';

	/**
	 * The sorting algorithm to use for results.
	 * @default 'version'
	 */
	@IsOptional()
	@IsIn([ 'version', 'date' ])
	sort: 'version' | 'date' = 'version';

	/**
	 * The direction to use for the sorting algorithm.
	 * @default 'desc'
	 */
	@IsOptional()
	@IsIn([ 'desc', 'asc' ])
	sort_order: 'desc' | 'asc' = 'desc';

	/**
	 * A comma-delimited list of release statuses to include in the search.
	 * @default 'published'
	 */
	@IsOptional()
	@IsString()
	status: string = 'published';

}
