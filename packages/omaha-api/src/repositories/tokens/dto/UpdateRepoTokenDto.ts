import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RepositoryScopeId, RepositoryScopes } from 'src/auth/auth.scopes';

export class UpdateRepoTokenDto {

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description?: string;

	@IsOptional()
	@IsEnum(RepositoryScopes.map(scope => scope.id), { each: true })
	scopes?: RepositoryScopeId[];

	@IsOptional()
	@IsBoolean()
	invalidate?: boolean;

}
