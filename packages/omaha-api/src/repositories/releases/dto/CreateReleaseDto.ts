import { ArrayNotEmpty, IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReleaseDto {

	@IsDefined()
	@IsNotEmpty()
	@IsString()
	version!: string;

	@IsOptional()
	@IsString()
	description: string = '';

	@IsDefined()
	@IsString({ each: true })
	@ArrayNotEmpty()
	tags!: string[];

}
