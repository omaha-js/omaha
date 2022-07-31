import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { Repository as TypeOrmRepository } from 'typeorm';

@Injectable()
export class AttachmentsService {

	public constructor(
		@InjectRepository(ReleaseAttachment) private readonly repository: TypeOrmRepository<ReleaseAttachment>,
	) {}

	public async save(attachment: ReleaseAttachment) {
		return this.repository.save(attachment);
	}

	public async create() {
		return this.repository.create();
	}

	public async incrementDownloadCount(attachment: ReleaseAttachment) {
		return this.repository.update(attachment.id, {
			download_count: () => 'download_count + 1'
		});
	}

}
