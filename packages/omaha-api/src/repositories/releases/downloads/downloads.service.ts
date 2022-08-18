import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { ReleaseDownload } from 'src/entities/ReleaseDownload';
import { Token } from 'src/entities/Token';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository } from 'src/entities/Repository';
import { Release } from 'src/entities/Release';
import { DownloadLogsDto } from './dto/DownloadLogsDto';
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
		token: Token | null,
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
		const query = this.repository.createQueryBuilder();
		const history = new Array<DownloadHistoryRecord>();

		// Data ranges from one year ago (52 weeks = 364 days) to yesterday
		const startDate = moment().subtract(364, 'day').format('YYYY-MM-DD');
		const endDate = moment().subtract(1, 'day').format('YYYY-MM-DD');

		// Group downloads on a weekly interval
		query.select(`'${startDate}' + INTERVAL (DATEDIFF(date, '${startDate}') DIV 7) WEEK AS date_start`);
		query.addSelect(`'${startDate}' + INTERVAL 6 DAY + INTERVAL (DATEDIFF(date, '${startDate}') DIV 7) WEEK AS date_end`);
		query.addSelect(`COUNT(*) AS downloads`);

		// Target constraint
		if (target instanceof Repository) query.where('repository_id = :id', target);
		else if (target instanceof Release) query.where('release_id = :id', target);
		else if (target instanceof ReleaseAttachment) query.where('attachment_id = :id', target);

		// Date range & grouping
		query.andWhere(`date >= '${startDate}'`);
		query.andWhere(`date <= '${endDate}'`);
		query.groupBy(`date_start, date_end`);

		// Compile the data
		// Note: The download counts are returned as strings
		const records = await query.getRawMany();
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

	public async getDownloadLogs(target: Repository | Release | ReleaseAttachment, params: DownloadLogsDto) {
		const query = this.repository.createQueryBuilder('ReleaseDownload');
		const page = params.page ?? 1;
		const count = params.count ?? 25;

		// Target constraint
		if (target instanceof Repository) query.where('ReleaseDownload.repository = :id', target);
		else if (target instanceof Release) query.where('ReleaseDownload.release_id = :id', target);
		else if (target instanceof ReleaseAttachment) query.where('ReleaseDownload.attachment_id = :id', target);

		// Left join tokens
		query.leftJoinAndSelect('ReleaseDownload.token', 'Token');
		query.leftJoinAndSelect('ReleaseDownload.release', 'Release');
		query.leftJoinAndSelect('ReleaseDownload.attachment', 'ReleaseAttachment');
		query.leftJoinAndSelect('ReleaseAttachment.asset', 'Asset');

		// Date range & grouping
		query.orderBy('ReleaseDownload.id', 'DESC');

		// Get total number of results
		const total = await query.getCount();

		// Pagination
		query.take(count);
		query.skip((count * page) - count);

		const logs = await query.getMany();

		return {
			pagination: {
				page,
				page_count: Math.max(1, Math.ceil(total / count)),
				page_size: count,
				num_results: total
			},
			logs
		};
	}

}

export interface DownloadHistoryRecord {
	date_start: string;
	date_end: string;
	downloads: number;
}
