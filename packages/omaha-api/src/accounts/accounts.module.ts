import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/entities/Account';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { TokensController } from './tokens/tokens.controller';
import { TokensModule } from './tokens/tokens.module';
import { ActionsModule } from './actions/actions.module';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Account ]),
		TokensModule,
		ActionsModule
	],
	exports: [
		AccountsService
	],
	providers: [
		AccountsService
	],
	controllers: [AccountsController, TokensController],
})
export class AccountsModule {}
