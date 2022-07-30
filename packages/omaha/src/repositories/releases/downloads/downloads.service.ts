import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { ReleaseDownload } from 'src/entities/ReleaseDownload';
import { Token } from 'src/entities/Token';
import { Repository as TypeOrmRepository } from 'typeorm';

@Injectable()
export class DownloadsService {

	public constructor(
		@InjectRepository(ReleaseDownload) private readonly repository: TypeOrmRepository<ReleaseDownload>,
	) {}

	/**
	 * Records a download in the database for the given token and attachment.
	 *
	 * @param attachment
	 * @param token
	 * @param ip
	 * @returns
	 */
	public async recordDownload(attachment: ReleaseAttachment, token: Token, ip: string) {
		const download = this.repository.create({
			time: new Date(),
			ip,
			token
		});

		download.attachment = Promise.resolve(attachment);

		return this.repository.save(download);
	}

}
