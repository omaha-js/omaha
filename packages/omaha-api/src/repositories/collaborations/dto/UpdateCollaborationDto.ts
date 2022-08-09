import { IsEnum, IsOptional } from 'class-validator';
import { RepositoryScopeId, RepositoryScopes } from 'src/auth/auth.scopes';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';

export class UpdateCollaborationDto {

	@IsOptional()
	@IsEnum(CollaborationRole)
	role?: CollaborationRole;

	@IsOptional()
	@IsEnum(RepositoryScopes.map(scope => scope.id), { each: true })
	scopes?: RepositoryScopeId[];

}
