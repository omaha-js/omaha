import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Repository } from 'src/entities/Repository';
import { RepositoriesGuard } from 'src/repositories/repositories.guard';
import { Repo } from 'src/support/Repo';
import { ReleasesService } from '../releases.service';
import { DownloadsService } from './downloads.service';
import { DownloadLogsDto } from './dto/DownloadLogsDto';

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

	@Get('logs')
	@UseScopes('repo.audit.downloads')
	public async getRepositoryDownloadLogs(@Repo() repository: Repository, @Query() params: DownloadLogsDto) {
		const { pagination, logs } = await this.downloads.getDownloadLogs(repository, params);

		return {
			repository,
			pagination,
			logs
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

	@Get('logs/:version')
	@UseScopes('repo.audit.downloads')
	public async getReleaseDownloadLogs(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Query() params: DownloadLogsDto
	) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const { pagination, logs } = await this.downloads.getDownloadLogs(release, params);

		return {
			release,
			pagination,
			logs
		};
	}

	@Get('history/:version/:asset')
	public async getAttachmentDownloads(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Param('asset') assetName: string
	) {
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

	@Get('logs/:version/:asset')
	@UseScopes('repo.audit.downloads')
	public async getAttachmentDownloadLogs(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Param('asset') assetName: string,
		@Query() params: DownloadLogsDto
	) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const attachment = (await release.attachments).find(
			attachment => attachment.asset.name.toLowerCase() === assetName.toLowerCase()
		);

		if (!attachment) {
			throw new NotFoundException(`The specified attachment was not found in the release`);
		}

		const { pagination, logs } = await this.downloads.getDownloadLogs(attachment, params);

		return {
			attachment,
			pagination,
			logs
		};
	}

}
