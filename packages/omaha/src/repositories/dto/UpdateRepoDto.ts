import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RepoAccess, RepoVersionScheme } from '../repositories.types';

export class UpdateRepoDto {

	@IsOptional()
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsEnum(RepoVersionScheme)
	scheme: RepoVersionScheme;

	@IsOptional()
	@IsEnum(RepoAccess)
	access?: RepoAccess;

}
