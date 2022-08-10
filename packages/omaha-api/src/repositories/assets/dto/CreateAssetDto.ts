import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAssetDto {

	@IsDefined()
	@IsString()
	@MaxLength(32)
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description: string = '';

	@IsDefined()
	@IsBoolean()
	required!: boolean;

}
