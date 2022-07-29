import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from 'src/accounts/accounts.module';
import { Token } from 'src/entities/Token';
import { TokensService } from './tokens.service';

@Global()
@Module({
	imports: [
		AccountsModule,
		TypeOrmModule.forFeature([ Token ])
	],
	providers: [TokensService],
	exports: [TokensService]
})
export class TokensModule {}
