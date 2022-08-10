import { IsDefined, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { RepositoryScopeId, RepositoryScopes } from 'src/auth/auth.scopes';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';

export class CreateCollaborationDto {

	@IsDefined()
	@IsString()
	@IsEmail()
	email!: string;

	@IsDefined()
	@IsEnum(CollaborationRole)
	role!: CollaborationRole;

	@IsOptional()
	@IsEnum(RepositoryScopes.map(scope => scope.id), { each: true })
	scopes: RepositoryScopeId[] = [];

}
