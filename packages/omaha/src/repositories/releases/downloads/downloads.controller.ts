import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { Repository } from 'src/entities/Repository';
import { RepositoriesGuard } from 'src/repositories/repositories.guard';
import { Repo } from 'src/support/Repo';
import { ReleasesService } from '../releases.service';
import { DownloadsService } from './downloads.service';
import moment from 'moment';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { Release } from 'src/entities/Release';

@Controller('repositories/:repo_id/downloads')
@UseGuards(RepositoriesGuard)
export class DownloadsController {

	public constructor(
		private readonly releases: ReleasesService,
		private readonly downloads: DownloadsService
	) {}

	@Get('history')
	public async getRepositoryDownloads(@Repo() repository: Repository) {
		return {
			repository,
			history: await this.downloads.getWeeklyDownloads(repository)
		};
	}

	@Get('history/:version')
	public async getReleaseDownloads(@Repo() repo: Repository, @Param('version') version: string) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		await release.tags;

		return {
			release,
			history: await this.downloads.getWeeklyDownloads(release)
		};
	}

	@Get('history/:version/:asset')
	public async getAttachmentDownloads(@Repo() repo: Repository, @Param('version') version: string, @Param('asset') assetName: string) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const attachment = (await release.attachments).find(
			attachment => attachment.asset.name.toLowerCase() === assetName.toLowerCase()
		);

		if (!attachment) {
			throw new NotFoundException(`The specified attachment was not found in the release`);
		}

		return {
			attachment,
			history: await this.downloads.getWeeklyDownloads(attachment)
		};
	}

}
