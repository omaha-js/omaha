import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseJob } from 'src/entities/ReleaseJob';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { QueueService } from './queue.service';
import { Release } from 'src/entities/Release';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ ReleaseAttachment, ReleaseJob, Release ])
	],
	providers: [QueueService],
	exports: [QueueService]
})
export class QueueModule {}
