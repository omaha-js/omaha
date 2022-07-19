import { IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RepoAccess, RepoVersionScheme } from '../repositories.types';

export class CreateRepoDto {

	@IsDefined()
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsDefined()
	@IsEnum(RepoVersionScheme)
	scheme: RepoVersionScheme;

	@IsOptional()
	@IsEnum(RepoAccess)
	access?: RepoAccess;

}
