import { Global, Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';

@Global()
@Module({
	controllers: [TokensController],
})
export class TokensModule {}
