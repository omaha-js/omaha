import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from 'src/entities/Collaboration';
import { CollaborationsService } from './collaborations.service';
import { CollaborationsController } from './collaborations.controller';
import { CollaborationInvite } from 'src/entities/CollaborationInvite';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Collaboration, CollaborationInvite ]),
	],
	providers: [
		CollaborationsService
	],
	exports: [
		CollaborationsService
	],
	controllers: [CollaborationsController]
})
export class CollaborationsModule {}
