import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AccountsModule } from 'src/accounts/accounts.module';
import { TokensModule } from './tokens/tokens.module';

@Global()
@Module({
	imports: [
		AccountsModule,
		TokensModule
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
		AuthService
	],
	controllers: [
		AuthController
	]
})
export class AuthModule {}
