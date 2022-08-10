import { IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {

	@IsDefined()
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description: string = '';

}
