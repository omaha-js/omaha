import { IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { RepositoryVersionScheme } from 'src/entities/enum/RepositoryVersionScheme';
import { RepositoryAccessType } from '../../entities/enum/RepositoryAccessType';

export class CreateRepoDto {

	@IsDefined()
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description: string = '';

	@IsDefined()
	@IsEnum(RepositoryVersionScheme)
	scheme!: RepositoryVersionScheme;

	@IsOptional()
	@IsEnum(RepositoryAccessType)
	access: RepositoryAccessType = RepositoryAccessType.Private;

}
