import { Global, Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ ReleaseAttachment ]),
	],
	providers: [AttachmentsService],
	controllers: [AttachmentsController],
	exports: [AttachmentsService]
})
export class AttachmentsModule {}
