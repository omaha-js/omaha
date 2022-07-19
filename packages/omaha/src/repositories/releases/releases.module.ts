import { Global, Module } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Release } from 'src/entities/Release';
import { AssetsModule } from './assets/assets.module';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Release ]),
		AssetsModule,
	],
	providers: [ReleasesService],
	controllers: [ReleasesController],
	exports: [ReleasesService]
})
export class ReleasesModule {}
