import { CustomDecorator, SetMetadata } from '@nestjs/common';

export function UseRateLimit(key: string, int1m: number, int5m: number, int15m: number): CustomDecorator<string>;
export function UseRateLimit(int1m: number, int5m: number, int15m: number): CustomDecorator<string>;
export function UseRateLimit(...args: any[]): CustomDecorator<string> {
	if (typeof args[0] === 'number') {
		args.unshift(undefined);
	}

	return SetMetadata('ratelimit', args);
}
