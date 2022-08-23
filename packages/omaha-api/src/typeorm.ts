import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Environment } from './app.environment';

export const config: TypeOrmModuleOptions = {
	type: 'mysql',
	host: Environment.DATABASE_HOST,
	port: Environment.DATABASE_PORT,
	username: Environment.DATABASE_USERNAME,
	password: Environment.DATABASE_PASSWORD,
	database: Environment.DATABASE_NAME,
	entities: [
		__dirname + '/entities/*{.ts,.js}'
	],
	migrations: [__dirname + '/migrations/*{.ts,.js}'],
	migrationsRun: true,
	charset: 'utf8mb4_unicode_ci',
}

export const AppDataSource = new DataSource(config as any);
