import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReleaseAsset } from 'src/entities/ReleaseAsset';
import { Repository as TypeOrmRepository } from 'typeorm';

@Injectable()
export class AssetsService {

	public constructor(
		@InjectRepository(ReleaseAsset) private readonly repository: TypeOrmRepository<ReleaseAsset>,
	) {}

	public async save(asset: ReleaseAsset) {
		return this.repository.save(asset);
	}

	public async create() {
		return this.repository.create();
	}

}
