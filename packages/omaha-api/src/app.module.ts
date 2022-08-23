import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoriesModule } from './repositories/repositories.module';
import { StorageModule } from './storage/storage.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { NotificationsModule } from './notifications/notifications.module';
import { RatelimitModule } from './ratelimit/ratelimit.module';
import { AppController } from './app.controller';
import { config } from './typeorm';
import path from 'path';
import { AppLoggerMiddleware } from './app.middleware';

@Module({
	imports: [
		RatelimitModule,
		AuthModule,
		AccountsModule,
		TypeOrmModule.forRoot(config),
		RepositoriesModule,
		StorageModule,
		ScheduleModule.forRoot(),
		EmailModule,
		RealtimeModule,
		ServeStaticModule.forRoot({
			rootPath: path.resolve(__dirname, '../node_modules/@omaha/omaha-web/dist'),
			exclude: ['/v(\\d+)/(.*)']
		}),
		NotificationsModule
	],
	controllers: [
		AppController
	]
})
export class AppModule implements NestModule {

	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AppLoggerMiddleware).forRoutes('/v(\\d+)/*');
	}

}
