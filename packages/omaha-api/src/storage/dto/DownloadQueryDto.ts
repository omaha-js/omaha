import { IsDefined, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class DownloadQueryDto {

	/**
	 * The timestamp (in seconds) at which the download link expires.
	 */
	@IsDefined()
	@IsNumberString()
	@IsNotEmpty()
	expires!: number;

	/**
	 * The base64-encoded download token.
	 */
	@IsDefined()
	@IsString()
	@IsNotEmpty()
	signature!: string;

	/**
	 * The optional disposition header.
	 */
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	disposition?: string;

}
