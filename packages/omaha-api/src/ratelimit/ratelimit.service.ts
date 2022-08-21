import { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RatelimitManager } from './ratelimit.manager';

@Injectable()
export class RatelimitService {

	private globalLimit = [100, 500, 1500] as const;
	private managers = new Map<string | symbol, RatelimitManager>();

	/**
	 * The global rate limit manager.
	 */
	public readonly global: RatelimitManager;

	public constructor() {
		this.global = this.getManager('global', ...this.globalLimit);
	}

	/**
	 * Creates a new rate limit manager for the given key and interval limits.
	 *
	 * @param key The key to use for rate limiting.
	 * @param int1m The number of requests to allow per minute.
	 * @param int5m The number of requests to allow per 5 minutes.
	 * @param int15m The number of requests to allow per 15 minutes.
	 * @returns
	 */
	public getManager(key: string | symbol, int1m: number, int5m: number, int15m: number) {
		if (!this.managers.has(key)) {
			const manager = new RatelimitManager(this, key, int1m, int5m, int15m);
			this.managers.set(key, manager);
		}

		return this.managers.get(key)!;
	}

	/**
	 * Generates a fallback key to use for the given context.
	 *
	 * @param context
	 * @returns
	 */
	public getKeyFromContext(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<Request>();
		return `@auto:${request.method}/${context.getClass().name}/${context.getHandler().name}`;
	}

	@Cron('0 * * * * *')
	protected clearInterval1() {
		for (const manager of this.managers.values()) {
			manager.clearInterval('1m');
		}
	}

	@Cron('0 */5 * * * *')
	protected clearInterval5() {
		for (const manager of this.managers.values()) {
			manager.clearInterval('5m');
		}
	}

	@Cron('0 */15 * * * *')
	protected clearInterval15() {
		for (const manager of this.managers.values()) {
			manager.clearInterval('15m');
		}
	}

}

export type RateLimitInterval = '1m' | '5m' | '15m';
