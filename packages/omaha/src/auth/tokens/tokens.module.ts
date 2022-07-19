import { Module } from '@nestjs/common';
import { AccountsModule } from 'src/accounts/accounts.module';
import { TokensService } from './tokens.service';

@Module({
  imports: [AccountsModule],
  providers: [TokensService],
  exports: [TokensService]
})
export class TokensModule {}
