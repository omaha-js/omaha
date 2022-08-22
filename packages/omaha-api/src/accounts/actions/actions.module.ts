import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountAction } from 'src/entities/AccountAction';
import { ActionsService } from './actions.service';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ AccountAction ]),
	],
	providers: [ActionsService],
	exports: [ActionsService]
})
export class ActionsModule {}
