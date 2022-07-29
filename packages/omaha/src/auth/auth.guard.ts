import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthScopeId } from './auth.scopes';
import { BaseToken } from './tokens/models/BaseToken';
import { TokensService } from './tokens/tokens.service';

@Injectable()
export class AuthGuard implements CanActivate {

	public constructor(
		private readonly reflector: Reflector,
		private readonly tokens: TokensService
	) {}

	public async canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();
		const token = await this.getToken(request);

		const scopes = this.getScopesFromContext(context);
		const guests = this.getGuestFromContext(context);

		// Set the token on the request
		request.user = token;

		// Implement guest logic
		if (guests.allowGuest) {
			if (token && !guests.allowAuth) {
				throw new BadRequestException('You cannot access this endpoint while authenticated');
			}

			return true;
		}

		// Block the request if not authenticated
		if (!token) {
			throw new UnauthorizedException('Missing access token');
		}

		// Check for required scopes
		if (scopes.length > 0) {
			for (const scope of scopes) {
				if (!token.hasPermission(scope)) {
					throw new ForbiddenException('You do not have privileges to access this endpoint');
				}
			}
		}

		return true;
	}

	/**
	 * Returns the required scope(s) for the given context.
	 *
	 * @param context
	 * @returns
	 */
	private getScopesFromContext(context: ExecutionContext) {
		const scopesFromHandler = this.reflector.get<AuthScopeId[]>('auth.scopes', context.getHandler()) ?? [];
		const scopesFromController = this.reflector.get<AuthScopeId[]>('auth.scopes', context.getClass()) ?? [];

		return [...scopesFromController, ...scopesFromHandler];
	}

	/**
	 * Returns a tuple detailing whether guests are allowed for the given context and whether authentication is
	 * simultaneously allowed.
	 *
	 * @param context
	 */
	private getGuestFromContext(context: ExecutionContext) {
		const guestFromHandler = this.reflector.get<boolean>('auth.guest', context.getHandler());
		const guestFromController = this.reflector.get<boolean>('auth.guest', context.getClass());

		const allowGuest = typeof guestFromHandler === 'boolean' || typeof guestFromController === 'boolean';
		const allowAuth = (guestFromController || guestFromHandler || false);

		return {
			allowGuest,
			allowAuth
		};
	}

	/**
	 * Generates a token instance from the given request if possible, or returns undefined.
	 *
	 * @param request
	 * @returns
	 */
	private async getToken(request: Request): Promise<BaseToken | undefined> {
		const header = request.headers.authorization;

		if (header && header.toLowerCase().startsWith('bearer ')) {
			const token = header.substring(7).trim();

			if (token.length > 0) {
				return this.tokens.getToken(token);
			}
		}

		return;
	}

}
