import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAssetDto {

	@IsOptional()
	@IsString()
	@MaxLength(32)
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description: string = '';

	@IsOptional()
	@IsBoolean()
	required!: boolean;

}
