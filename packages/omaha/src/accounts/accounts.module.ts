import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/entities/Account';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([ Account ])
	],
	exports: [
		AccountsService
	],
	providers: [
		AccountsService
	],
	controllers: [AccountsController],
})
export class AccountsModule {}
