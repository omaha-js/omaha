import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from 'src/entities/Tag';
import { TagsController } from './tags.controller';4
import { TagsService } from './tags.service';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Tag ]),
	],
	controllers: [TagsController],
	providers: [TagsService],
	exports: [TagsService]
})
export class TagsModule {}
