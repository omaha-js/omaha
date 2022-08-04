import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RepositoryVersionScheme } from 'src/entities/enum/RepositoryVersionScheme';
import { RepositoryAccessType } from '../../entities/enum/RepositoryAccessType';

export class UpdateRepoDto {

	@IsOptional()
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsEnum(RepositoryVersionScheme)
	scheme: RepositoryVersionScheme;

	@IsOptional()
	@IsEnum(RepositoryAccessType)
	access?: RepositoryAccessType;

}
