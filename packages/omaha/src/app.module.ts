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

@Module({
	imports: [
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
				Repository,
				Collaboration,
				Tag,
				Asset,
				Release,
				ReleaseAttachment,
				ReleaseDownload,
				Token
			],
		}),
		RepositoriesModule,
		StorageModule,
		ScheduleModule.forRoot()
	],
})
export class AppModule {}
