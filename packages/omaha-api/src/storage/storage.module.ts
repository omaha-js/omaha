import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { RepositoriesService } from 'src/repositories/repositories.service';

@Global()
@Module({
	providers: [StorageService],
	exports: [StorageService],
	controllers: [StorageController]
})
export class StorageModule {}
