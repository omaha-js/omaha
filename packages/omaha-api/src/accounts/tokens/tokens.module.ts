import { Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';

@Module({
  controllers: [TokensController]
})
export class TokensModule {}
