import { Global, Module } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Release } from 'src/entities/Release';
import { AttachmentsModule } from './attachments/attachments.module';
import { DownloadsModule } from './downloads/downloads.module';
import { QueueModule } from './queue/queue.module';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Release ]),
		AttachmentsModule,
		DownloadsModule,
		QueueModule,
	],
	providers: [ReleasesService],
	controllers: [ReleasesController],
	exports: [ReleasesService]
})
export class ReleasesModule {}
