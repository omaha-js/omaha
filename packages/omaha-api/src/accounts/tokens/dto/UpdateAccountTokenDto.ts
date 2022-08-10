import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthScopeId, AuthScopes } from 'src/auth/auth.scopes';

export class UpdateAccountTokenDto {

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	description: string = '';

	@IsOptional()
	@IsEnum(AuthScopes.map(scope => scope.id), { each: true })
	scopes?: AuthScopeId[];

	@IsOptional()
	@IsBoolean()
	invalidate?: boolean;

}
