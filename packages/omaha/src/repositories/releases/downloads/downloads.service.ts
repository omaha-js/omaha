import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { ReleaseDownload } from 'src/entities/ReleaseDownload';
import { Token } from 'src/entities/Token';
import { Repository as TypeOrmRepository, SelectQueryBuilder } from 'typeorm';
import { Repository } from 'src/entities/Repository';
import { Release } from 'src/entities/Release';
import moment from 'moment';

@Injectable()
export class DownloadsService {

	public constructor(
		@InjectRepository(ReleaseDownload) public readonly repository: TypeOrmRepository<ReleaseDownload>,
	) {}

	/**
	 * Records a download in the database for the given token and attachment.
	 *
	 * @param attachment
	 * @param token
	 * @param ip
	 * @returns
	 */
	public async recordDownload(
		repo: Repository,
		release: Release,
		attachment: ReleaseAttachment,
		token: Token,
		ip: string
	) {
		const download = this.repository.create({
			date: moment().format('YYYY-MM-DD'),
			ip,
			token
		});

		download.attachment = Promise.resolve(attachment);
		download.release = Promise.resolve(release);
		download.repository = Promise.resolve(repo);

		return this.repository.save(download);
	}

	/**
	 * Computes weekly downloads of the target for the last year.
	 *
	 * @param target
	 * @returns
	 */
	public async getWeeklyDownloads(target: Repository | Release | ReleaseAttachment) {
		const q = this.repository.createQueryBuilder();
		const history = new Array<DownloadHistoryRecord>();

		// Data ranges from one year ago (52 weeks = 364 days) to yesterday
		const startDate = moment().subtract(364, 'day').format('YYYY-MM-DD');
		const endDate = moment().subtract(1, 'day').format('YYYY-MM-DD');

		// Group downloads on a weekly interval
		q.select(`'${startDate}' + INTERVAL (DATEDIFF(date, '${startDate}') DIV 7) WEEK AS date_start`);
		q.addSelect(`'${startDate}' + INTERVAL 6 DAY + INTERVAL (DATEDIFF(date, '${startDate}') DIV 7) WEEK AS date_end`);
		q.addSelect(`COUNT(*) AS downloads`);

		// Target constraint
		if (target instanceof Repository) q.where('repository_id = :id', target);
		else if (target instanceof Release) q.where('release_id = :id', target);
		else if (target instanceof ReleaseAttachment) q.where('attachment_id = :id', target);

		// Date range & grouping
		q.andWhere(`date >= '${startDate}'`);
		q.andWhere(`date <= '${endDate}'`);
		q.groupBy(`date_start, date_end`);

		// Compile the data
		// Note: The download counts are returned as strings
		const records = await q.getRawMany();
		const map = records.reduce((acc, curr) => (acc[curr.date_start] = curr, acc), {});

		for (let weekNumber = 52; weekNumber >= 1; weekNumber--) {
			const timestamp = moment().subtract(7 * weekNumber, 'day');
			const date_start = timestamp.format('YYYY-MM-DD');
			const date_end = timestamp.add(6, 'day').format('YYYY-MM-DD');
			const downloads = (date_start in map) ? +map[date_start].downloads : 0;

			history.push({
				date_start,
				date_end,
				downloads
			});
		}

		return history;
	}

}

export interface DownloadHistoryRecord {
	date_start: string;
	date_end: string;
	downloads: number;
}
