import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, Validate } from 'class-validator';
import { RepositoryVersionScheme } from 'src/entities/enum/RepositoryVersionScheme';
import { RepositoryAccessType } from '../../entities/enum/RepositoryAccessType';
import { RepositorySettingsObject } from '../settings/RepositorySettings';
import { RepositorySettingsValidator } from '../settings/RepositorySettingsValidator';

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
	scheme?: RepositoryVersionScheme;

	@IsOptional()
	@IsEnum(RepositoryAccessType)
	access?: RepositoryAccessType;

	@IsOptional()
	@IsObject()
	@Validate(RepositorySettingsValidator)
	settings?: Partial<RepositorySettingsObject>;

}
