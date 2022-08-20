import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueuedNotification } from 'src/entities/QueuedNotification';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ QueuedNotification ]),
	],
	controllers: [NotificationsController],
	providers: [NotificationsService],
	exports: [NotificationsService]
})
export class NotificationsModule {}
