import { Global, Module } from '@nestjs/common';
import { AssetsModule } from './assets/assets.module';
import { TagsModule } from './tags/tags.module';
import { TokensModule } from './tokens/tokens.module';
import { ReleasesModule } from './releases/releases.module';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'src/entities/Repository';
import { CollaborationsModule } from './collaborations/collaborations.module';
import { RepositoriesGuard } from './repositories.guard';

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([ Repository ]),
		AssetsModule,
		TagsModule,
		TokensModule,
		ReleasesModule,
		CollaborationsModule
	],
	controllers: [
		RepositoriesController
	],
	providers: [
		RepositoriesService,
		RepositoriesGuard
	],
	exports: [
		RepositoriesService
	]
})
export class RepositoriesModule {}
