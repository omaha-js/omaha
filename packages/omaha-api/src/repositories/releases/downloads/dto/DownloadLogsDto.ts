import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class DownloadLogsDto {

	/**
	 * The current page.
	 */
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	page?: number;

	/**
	 * The number of items to show per page.
	 */
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	@Max(100)
	count?: number;

}
