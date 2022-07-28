import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { Repository as TypeOrmRepository } from 'typeorm';

@Injectable()
export class AttachmentsService {

	public constructor(
		@InjectRepository(ReleaseAttachment) private readonly repository: TypeOrmRepository<ReleaseAttachment>,
	) {}

	public async save(asset: ReleaseAttachment) {
		return this.repository.save(asset);
	}

	public async create() {
		return this.repository.create();
	}

}
