import { BadRequestException, Controller, Get, InternalServerErrorException, Logger, NotFoundException, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Repository } from 'src/entities/Repository';
import { RepositoriesGuard } from 'src/repositories/repositories.guard';
import { Repo } from 'src/support/Repo';
import { ReleasesService } from '../releases.service';
import { Environment } from 'src/app.environment';
import { StorageService } from 'src/storage/storage.service';
import { AttachmentsService } from './attachments.service';
import { User } from 'src/support/User';
import { BaseToken } from 'src/auth/tokens/models/BaseToken';
import { DownloadsService } from '../downloads/downloads.service';
import { Request } from 'express';
import fs from 'fs';
import crypto from 'crypto';

@Controller('repositories/:repo_id/releases/:version/:asset')
@UseGuards(RepositoriesGuard)
export class AttachmentsController {

	private logger = new Logger(this.constructor.name);

	public constructor(
		private readonly service: AttachmentsService,
		private readonly releases: ReleasesService,
		private readonly storage: StorageService,
		private readonly downloads: DownloadsService
	) {}

	/**
	 * Reads an attachment.
	 *
	 * @param repo
	 * @param version
	 * @param assetName
	 * @returns
	 */
	@Get()
	public async getAttachment(@Repo() repo: Repository, @Param('version') version: string, @Param('asset') assetName: string) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const attachment = (await release.attachments).find(
			attachment => attachment.asset.name.toLowerCase() === assetName.toLowerCase()
		);

		if (!attachment) {
			throw new NotFoundException(`The specified attachment was not found in the release`);
		}

		return attachment;
	}

	/**
	 * Creates a download link for an attachment.
	 */
	@Get('download')
	@UseScopes('repo.releases.attachments.download')
	public async downloadAttachment(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Param('asset') assetName: string,
		@User() token: BaseToken,
		@Req() request: Request
	) {
		const expiration = 600000;
		const attachment = await this.getAttachment(repo, version, assetName);
		const disposition = `attachment; filename="${attachment.file_name}"`;
		const url = await this.storage.getDownloadLink(repo, attachment.object_name, expiration, disposition);
		const release = await attachment.release;

		if (token.isDatabaseToken() && !release.draft) {
			await Promise.all([
				this.downloads.recordDownload(repo, release, attachment, token.token, request.ip),
				this.releases.recordDownload(release),
				this.service.incrementDownloadCount(attachment)
			]);
		}

		return {
			file_name: attachment.file_name,
			mime: attachment.mime,
			size: attachment.size,
			hash: attachment.hash.toString('hex'),
			download_url: url,
			expires_in: Math.floor(expiration / 1000)
		};
	}

	/**
	 * Uploads an attachment.
	 *
	 * @param repo
	 * @param version
	 * @param assetName
	 * @param file
	 * @returns
	 */
	@Post()
	@UseScopes('repo.releases.attachments.manage')
	@UseInterceptors(FileInterceptor('file', { dest: Environment.TEMP_DIRNAME }))
	public async uploadAttachment(@Repo() repo: Repository, @Param('version') version: string, @Param('asset') assetName: string, @UploadedFile() file: Express.Multer.File) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const repoAsset = (await repo.assets).find(asset => asset.name.toLowerCase() === assetName.toLowerCase());
		const attachment = (await release.attachments).find(attachment => attachment.asset.id === repoAsset.id);

		// Preflight checks
		if (!file) throw new BadRequestException(`Missing file upload`);
		if (!repoAsset) throw new NotFoundException(`The specified asset was not found in the repository`);
		if (!release.draft) throw new BadRequestException(`Cannot upload attachments to a published release`);

		// Make sure the file exists
		if (!fs.existsSync(file.path)) {
			throw new InternalServerErrorException('File not found (internal)');
		}

		try {
			// Create the read stream
			const stream = fs.createReadStream(file.path, { encoding: 'binary' });
			const name = `${release.version}/${repoAsset.name}`;

			// Compute a SHA-256 hash for the file by intercepting the stream
			const hash = crypto.createHash('sha256');
			stream.on('data', data => {
				if (typeof data === 'string') hash.update(data, 'binary');
				else hash.update(data);
			});

			// Write the file to storage
			const saveName = await this.storage.write(repo, name, stream);

			// Clean up the file
			await fs.promises.unlink(file.path);

			// Update an existing attachment
			if (attachment) {
				attachment.file_name = file.originalname,
				attachment.object_name = saveName;
				attachment.mime = file.mimetype;
				attachment.size = file.size;
				attachment.hash = hash.digest();

				return await this.service.save(attachment);
			}

			// Create a new attachment
			else {
				const attachment = await this.service.create();
				attachment.file_name = file.originalname;
				attachment.object_name = saveName;
				attachment.size = file.size;
				attachment.mime = file.mimetype;
				attachment.release = Promise.resolve(release);
				attachment.asset = repoAsset;
				attachment.hash = hash.digest();

				return await this.service.save(attachment);
			}
		}
		catch (err) {
			this.logger.error('Attachment upload failed:', err);

			try { await fs.promises.unlink(file.path); }
			catch (err) {}

			throw new InternalServerErrorException();
		}
	}

}
