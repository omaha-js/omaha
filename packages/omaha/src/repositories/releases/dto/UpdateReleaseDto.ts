import { ArrayNotEmpty, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateReleaseDto {

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsBoolean()
	draft?: boolean;

	@IsOptional()
	@IsString({ each: true })
	@ArrayNotEmpty()
	tags: string[];

}
