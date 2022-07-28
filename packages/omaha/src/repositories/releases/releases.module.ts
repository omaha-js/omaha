import { Global, Module } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Release } from 'src/entities/Release';
import { AttachmentsModule } from './attachments/attachments.module';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Release ]),
		AttachmentsModule,
	],
	providers: [ReleasesService],
	controllers: [ReleasesController],
	exports: [ReleasesService]
})
export class ReleasesModule {}
