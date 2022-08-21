import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RatelimitManager } from 'src/ratelimit/ratelimit.manager';
import { RatelimitService } from 'src/ratelimit/ratelimit.service';
import { AuthScopeId } from './auth.scopes';
import { BaseToken } from './tokens/models/BaseToken';
import { TokensService } from './tokens/tokens.service';

@Injectable()
export class AuthGuard implements CanActivate {

	private tokenMissManager: RatelimitManager;

	public constructor(
		private readonly reflector: Reflector,
		private readonly tokens: TokensService,
		private readonly ratelimit: RatelimitService
	) {
		this.tokenMissManager = this.ratelimit.getManager('auth_token_misses', 5, 10, 20);
	}

	public async canActivate(context: ExecutionContext) {
		switch (context.getType()) {
			case 'http': return this.validateForHttp(context);
			default: throw new BadRequestException('Unsupported request type');
		}
	}

	private async validateForHttp(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();
		const token = await this.getToken(request);

		const scopes = this.getScopesFromContext(context);
		const guests = this.getGuestFromContext(context);
		const isPrivate = this.reflector.get('auth.private', context.getHandler());

		// Set the token on the request
		request.user = token;

		// Rate limit database tokens
		if (token && token.isDatabaseToken()) {
			if (this.ratelimit.global.guard(token.token) === false) {
				throw new HttpException(`You're sending requests too quickly`, 429);
			}
		}

		// Implement guest logic
		if (guests.allowGuest) {
			if (token && !guests.allowAuth) {
				throw new BadRequestException('You cannot access this endpoint while authenticated');
			}

			return true;
		}

		// Block the request if not authenticated
		if (!token && (scopes.length > 0 || isPrivate)) {
			throw new UnauthorizedException('Missing access token');
		}

		// Check for required scopes
		if (scopes.length > 0) {
			for (const scope of scopes) {
				if (!token!.hasPermission(scope)) {
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

		if (this.tokenMissManager.check(request.ip) === 0) {
			throw new HttpException(`You've sent an incorrect token too many times! Try again later.`, 429);
		}

		if (header && header.toLowerCase().startsWith('bearer ')) {
			const token = header.substring(7).trim();

			if (token.length > 0) {
				try {
					return await this.tokens.getTokenOrFail(token);
				}
				catch (error) {
					this.tokenMissManager.guard(request.ip);
					throw new UnauthorizedException('Invalid token');
				}
			}
		}

		return;
	}

}
