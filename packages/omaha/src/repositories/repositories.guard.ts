import { CanActivate, ExecutionContext, ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RepositoryScopeId } from 'src/auth/auth.scopes';
import { BaseToken } from 'src/auth/tokens/models/BaseToken';
import { Collaboration } from 'src/entities/Collaboration';
import { CollaborationsService } from './collaborations/collaborations.service';
import { CollaboratorRole } from './collaborations/collaborations.types';

/**
 * This guard looks at the `repo_id` parameter for the current request as well as the current token from the
 * authentication guard, and enforces scoped permissions and repository access accordingly.
 */
@Injectable()
export class RepositoriesGuard implements CanActivate {

	public constructor(
		private readonly reflector: Reflector,
		private readonly collaborations: CollaborationsService,
	) {}

	public async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();
		const token = request.user as BaseToken;
		const scopes = this.getScopesFromContext(context);

		if (!token) {
			throw new UnauthorizedException('Token is missing');
		}

		if (!('repo_id' in request.params)) {
			throw new InternalServerErrorException('Could not find the repository id for this request');
		}

		if (typeof request.params.repo_id !== 'string') {
			throw new InternalServerErrorException('Invalid repository id');
		}

		if (token.isForAccount()) {
			const repoId = request.params.repo_id;
			const collaboration = await this.collaborations.getForAccountAndRepository(token.account, repoId);

			if (!collaboration) {
				throw new ForbiddenException('You do not have access to the requested repository');
			}

			if (scopes.length > 0) {
				for (const scope of scopes) {
					if (!collaboration.hasPermission(scope)) {
						throw new ForbiddenException('You do not have privileges to access this endpoint');
					}
				}
			}

			// This is not legit, don't do this, why am I doing this?
			// Gotta go fast...
			(request as any)._guardedRepository = collaboration.repository;
			(request as any)._guardedCollaboration = collaboration;

			return true;
		}

		else if (token.isForRepository()) {
			if (token.repository.id !== request.params.repo_id.toLowerCase()) {
				throw new ForbiddenException('You do not have access to the requested repository');
			}

			if (scopes.length > 0) {
				for (const scope of scopes) {
					if (!token.hasPermission(scope)) {
						throw new ForbiddenException('You do not have privileges to access this endpoint');
					}
				}
			}

			const collaboration = new TokenCollaboration();
			collaboration.scopes = token.scopes as any;
			collaboration.role = CollaboratorRole.Custom;

			(request as any)._guardedRepository = token.repository;
			(request as any)._guardedCollaboration = collaboration;

			return true;
		}

		throw new InternalServerErrorException('Not implemented');
	}

	/**
	 * Returns the required scope(s) for the given context.
	 *
	 * @param context
	 * @returns
	 */
	private getScopesFromContext(context: ExecutionContext) {
		const scopesFromHandler = this.reflector.get<RepositoryScopeId[]>('auth.scopes', context.getHandler()) ?? [];
		const scopesFromController = this.reflector.get<RepositoryScopeId[]>('auth.scopes', context.getClass()) ?? [];

		return [...scopesFromController, ...scopesFromHandler];
	}

}

export class TokenCollaboration extends Collaboration {

	public override isToken(): this is TokenCollaboration {
		return true;
	}

}
