import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description?: string;

}
