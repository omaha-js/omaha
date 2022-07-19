import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseAsset } from 'src/entities/ReleaseAsset';

@Module({
	imports: [
		TypeOrmModule.forFeature([ ReleaseAsset ]),
	],
	providers: [AssetsService],
	controllers: [AssetsController]
})
export class AssetsModule {}
