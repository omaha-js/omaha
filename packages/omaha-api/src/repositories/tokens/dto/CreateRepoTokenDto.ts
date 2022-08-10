import { IsDefined, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RepositoryScopeId, RepositoryScopes } from 'src/auth/auth.scopes';

export class CreateRepoTokenDto {

	@IsDefined()
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description: string = '';

	@IsDefined()
	@IsInt()
	expiration!: number;

	@IsDefined()
	@IsEnum(RepositoryScopes.map(scope => scope.id), { each: true })
	scopes!: RepositoryScopeId[];

}
