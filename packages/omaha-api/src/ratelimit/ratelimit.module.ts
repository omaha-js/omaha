import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RatelimitGuard } from './ratelimit.guard';
import { RatelimitService } from './ratelimit.service';

@Global()
@Module({
	providers: [
		RatelimitService,
		{
			provide: APP_GUARD,
			useClass: RatelimitGuard,
		},
	],
	exports: [RatelimitService]
})
export class RatelimitModule {}
