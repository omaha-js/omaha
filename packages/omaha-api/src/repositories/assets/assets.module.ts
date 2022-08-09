import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from 'src/entities/Asset';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Asset ]),
	],
	controllers: [AssetsController],
	providers: [AssetsService],
	exports: [AssetsService]
})
export class AssetsModule {}
