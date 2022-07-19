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
import { ReleaseAsset } from './entities/ReleaseAsset';
import { StorageModule } from './storage/storage.module';

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
				ReleaseAsset
			],
		}),
		RepositoriesModule,
		StorageModule
	],
})
export class AppModule {}
