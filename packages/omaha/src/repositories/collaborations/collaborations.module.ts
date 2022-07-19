import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from 'src/entities/Collaboration';
import { CollaborationsService } from './collaborations.service';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Collaboration ]),
	],
	providers: [
		CollaborationsService
	],
	exports: [
		CollaborationsService
	]
})
export class CollaborationsModule {}
