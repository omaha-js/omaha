import { BadRequestException, CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RatelimitService } from './ratelimit.service';

@Injectable()
export class RatelimitGuard implements CanActivate {

	public constructor(
		private readonly reflector: Reflector,
		private readonly service: RatelimitService
	) {}

	public canActivate(context: ExecutionContext) {
		switch (context.getType()) {
			case 'http': return this.validateForHttp(context);
			default: throw new BadRequestException('Unsupported request type');
		}
	}

	private async validateForHttp(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();
		const custom = this.reflector.get<CustomRateLimit | undefined>('ratelimit', context.getHandler());

		if (this.service.global.guard(request.ip) === false) {
			throw new HttpException(`You're sending requests too quickly`, 429);
		}

		if (custom) {
			custom[0] ??= this.service.getKeyFromContext(context);

			if (this.service.getManager(...custom).guard(request.ip) === false) {
				throw new HttpException(`You're sending requests too quickly`, 429);
			}
		}

		return true;
	}

}

type CustomRateLimit = [key: string, int1: number, int5: number, int15: number];
