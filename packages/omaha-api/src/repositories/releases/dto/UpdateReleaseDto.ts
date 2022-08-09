import { ArrayNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';

export class UpdateReleaseDto {

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsEnum(ReleaseStatus)
	status?: ReleaseStatus;

	@IsOptional()
	@IsString({ each: true })
	@ArrayNotEmpty()
	tags: string[];

}
