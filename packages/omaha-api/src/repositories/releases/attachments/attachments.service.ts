import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from 'src/entities/Asset';
import { Release } from 'src/entities/Release';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { Repository } from 'src/entities/Repository';
import { Repository as TypeOrmRepository } from 'typeorm';

@Injectable()
export class AttachmentsService {

	public constructor(
		@InjectRepository(ReleaseAttachment) private readonly repository: TypeOrmRepository<ReleaseAttachment>,
	) {}

	public async save(attachment: ReleaseAttachment) {
		return this.repository.save(attachment);
	}

	public async delete(attachment: ReleaseAttachment) {
		return this.repository.delete(attachment.id);
	}

	public async create() {
		return this.repository.create();
	}

	/**
	 * Increments the download count on the given attachment without bumping the update timestamp.
	 *
	 * @param attachment
	 * @returns
	 */
	public async incrementDownloadCount(attachment: ReleaseAttachment) {
		return this.repository.update(attachment.id, {
			download_count: () => 'download_count + 1',
			updated_at: () => 'updated_at'
		});
	}

	/**
	 * Gets *all* attachments for a repository. Careful!
	 *
	 * @param repo
	 * @returns
	 */
	public async getAllForRepository(repo: Repository) {
		const query = this.repository.createQueryBuilder();

		query.addFrom(Release, 'Release');
		query.andWhere('ReleaseAttachment.release_id = Release.id');
		query.andWhere('Release.repository_id = :id', repo);

		return query.getMany();
	}

	/**
	 * Gets the total count of all attachments for a repository.
	 *
	 * @param repo
	 * @returns
	 */
	public async getAllForRepositoryCount(repo: Repository) {
		const query = this.repository.createQueryBuilder();

		query.addFrom(Release, 'Release');
		query.andWhere('ReleaseAttachment.release_id = Release.id');
		query.andWhere('Release.repository_id = :id', repo);

		return query.getCount();
	}

	/**
	 * Gets the total count of all attachments for an asset.
	 *
	 * @param asset
	 * @returns
	 */
	public async getForAssetCount(asset: Asset) {
		const query = this.repository.createQueryBuilder();

		query.andWhere('ReleaseAttachment.asset_id = :id', asset);

		return query.getCount();
	}

}
