import { IsDefined, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, Validate } from 'class-validator';
import { RepositoryVersionScheme } from 'src/entities/enum/RepositoryVersionScheme';
import { RepositoryAccessType } from '../../entities/enum/RepositoryAccessType';
import { RepositorySettingsObject } from '../settings/RepositorySettings';
import { RepositorySettingsValidator } from '../settings/RepositorySettingsValidator';

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

	@IsOptional()
	@IsObject()
	@Validate(RepositorySettingsValidator)
	settings?: Partial<RepositorySettingsObject>;

}
