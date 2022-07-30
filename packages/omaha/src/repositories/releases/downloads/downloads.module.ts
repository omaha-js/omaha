import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseDownload } from 'src/entities/ReleaseDownload';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ ReleaseDownload ]),
	],
	controllers: [DownloadsController],
	providers: [DownloadsService],
	exports: [DownloadsService]
})
export class DownloadsModule {}
