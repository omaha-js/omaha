import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';

@Module({
	imports: [
		TypeOrmModule.forFeature([ ReleaseAttachment ]),
	],
	providers: [AssetsService],
	controllers: [AssetsController]
})
export class AssetsModule {}
