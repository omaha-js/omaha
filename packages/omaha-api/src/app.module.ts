import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment } from './app.environment';
import { Account } from './entities/Account';
import { RepositoriesModule } from './repositories/repositories.module';
import { Repository } from './entities/Repository';
import { Collaboration } from './entities/Collaboration';
import { Tag } from './entities/Tag';
import { Asset } from './entities/Asset';
import { Release } from './entities/Release';
import { ReleaseAttachment } from './entities/ReleaseAttachment';
import { StorageModule } from './storage/storage.module';
import { ReleaseDownload } from './entities/ReleaseDownload';
import { Token } from './entities/Token';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { CollaborationInvite } from './entities/CollaborationInvite';
import { RealtimeModule } from './realtime/realtime.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { NotificationsModule } from './notifications/notifications.module';
import { QueuedNotification } from './entities/QueuedNotification';
import { RatelimitModule } from './ratelimit/ratelimit.module';
import path from 'path';
import { AccountAction } from './entities/AccountAction';
import { AppController } from './app.controller';

@Module({
	imports: [
		RatelimitModule,
		AuthModule,
		AccountsModule,
		TypeOrmModule.forRoot({
			type: 'mysql',
			host: Environment.DATABASE_HOST,
			port: Environment.DATABASE_PORT,
			username: Environment.DATABASE_USERNAME,
			password: Environment.DATABASE_PASSWORD,
			database: Environment.DATABASE_NAME,
			synchronize: true,
			entities: [
				Account,
				AccountAction,
				Repository,
				Collaboration,
				CollaborationInvite,
				Tag,
				Asset,
				Release,
				ReleaseAttachment,
				ReleaseDownload,
				Token,
				QueuedNotification
			],
		}),
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
export class AppModule {}
