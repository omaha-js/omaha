import { BadRequestException, Controller, ForbiddenException, Get, Logger, NotFoundException, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';
import { Collab } from 'src/support/Collab';
import { Collaboration } from 'src/entities/Collaboration';
import { RealtimeService } from 'src/realtime/realtime.service';
import { RepositoryAccessType } from 'src/entities/enum/RepositoryAccessType';
import { AttachmentStorageEngine } from './storage/AttachmentStorageEngine';
import { AttachmentStorageGuard } from './storage/AttachmentStorageGuard';
import { Release } from 'src/entities/Release';
import { Asset } from 'src/entities/Asset';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';

@Controller('repositories/:repo_id/releases/:version/:asset')
@UseGuards(RepositoriesGuard)
export class AttachmentsController {

	private logger = new Logger(this.constructor.name);

	public constructor(
		private readonly service: AttachmentsService,
		private readonly releases: ReleasesService,
		private readonly storage: StorageService,
		private readonly downloads: DownloadsService,
		private readonly ws: RealtimeService,
	) {}

	/**
	 * Reads an attachment.
	 *
	 * @param repo
	 * @param version
	 * @param assetName
	 * @param collab
	 * @returns
	 */
	@Get()
	public async getAttachment(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Param('asset') assetName: string,
		@Collab() collab?: Collaboration
	) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const attachment = (await release.attachments).find(
			attachment => attachment.asset.name.toLowerCase() === assetName.toLowerCase()
		);

		if (release.status === ReleaseStatus.Draft && (!collab || !collab.hasPermission('repo.releases.attachments.manage'))) {
			throw new NotFoundException(`No version matching '${version}' exists within the repository`);
		}

		if (!attachment) {
			throw new NotFoundException(`The specified attachment was not found in the release`);
		}

		return attachment;
	}

	/**
	 * Creates a download link for an attachment.
	 */
	@Get('download')
	public async downloadAttachment(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Param('asset') assetName: string,
		@Req() request: Request,
		@User() token?: BaseToken,
		@Collab() collab?: Collaboration
	) {
		if (repo.access === RepositoryAccessType.Private) {
			if (
				!collab || !token ||
				!collab.hasPermission('repo.releases.attachments.download') ||
				!token.hasPermission('repo.releases.attachments.download')
			) {
				throw new ForbiddenException('You do not have access to this endpoint');
			}
		}

		const expiration = 600000;
		const attachment = await this.getAttachment(repo, version, assetName, collab);
		const disposition = `attachment; filename="${attachment.file_name}"`;
		const release = await attachment.release;

		if (release.status === ReleaseStatus.Archived) {
			if (!collab || !collab.hasPermission('repo.releases.attachments.manage')) {
				throw new BadRequestException('Archived releases cannot be downloaded');
			}

			if (release.purged_at) {
				throw new BadRequestException(
					'The files for this release have been purged and can no longer be downloaded'
				);
			}
		}

		if (token && token.isDatabaseToken() && release.status !== ReleaseStatus.Draft) {
			await Promise.all([
				this.downloads.recordDownload(repo, release, attachment, token.token, request.ip),
				this.releases.recordDownload(release),
				this.service.incrementDownloadCount(attachment)
			]);
		}
		else if (!token) {
			await Promise.all([
				this.downloads.recordDownload(repo, release, attachment, null, request.ip),
				this.releases.recordDownload(release),
				this.service.incrementDownloadCount(attachment)
			]);
		}

		const url = await this.storage.getDownloadLink(
			this.storage.getObjectName(repo, attachment.object_name!),
			expiration,
			disposition
		);

		return {
			file_name: attachment.file_name,
			mime: attachment.mime,
			size: attachment.size,
			hash_sha1: attachment.hash_sha1.toString('hex'),
			hash_md5: attachment.hash_md5.toString('hex'),
			download_url: url,
			expires_in: expiration
		};
	}

	/**
	 * Uploads an attachment.
	 *
	 * @param file
	 * @returns
	 */
	@Post()
	@UseScopes('repo.releases.attachments.manage')
	@UseGuards(AttachmentStorageGuard)
	@UseInterceptors(FileInterceptor('file', { dest: Environment.TEMP_DIRNAME, storage: new AttachmentStorageEngine() }))
	public async uploadAttachment(@Req() request: Request, @UploadedFile() file: Express.Multer.File) {
		// Get controller entities
		const repo: Repository = (request as any)._attachRepository;
		const release: Release = (request as any)._attachRelease;
		const asset: Asset = (request as any)._attachAsset;
		const attachment: ReleaseAttachment = (request as any)._attachAttachment;

		// Get attachment parameters
		const success: boolean = (request as any)._attachFileReady;
		const hash_sha1: Buffer = (request as any)._attachHashSHA1;
		const hash_md5: Buffer = (request as any)._attachHashMD5;
		const size: number = (request as any)._attachFileSize;

		try {
			// Check for successful upload
			if (!success) {
				throw new BadRequestException('File upload failed');
			}

			// Update an existing attachment
			if (attachment) {
				// Delete old objects
				if (typeof attachment.object_name === 'string' && attachment.object_name !== file.filename) {
					try {
						await this.storage.delete(this.storage.getObjectName(repo, attachment.object_name));
					}
					catch (err) {}
				}

				attachment.file_name = file.originalname,
				attachment.object_name = file.filename;
				attachment.mime = file.mimetype;
				attachment.size = size;
				attachment.hash_sha1 = hash_sha1;
				attachment.hash_md5 = hash_md5;

				await attachment.release;
				await this.service.save(attachment);

				this.ws.emit(repo, 'attachment_updated', { attachment }, [
					'repo.releases.attachments.manage'
				]);

				return attachment;
			}

			// Create a new attachment
			else {
				const attachment = await this.service.create();
				attachment.file_name = file.originalname;
				attachment.object_name = file.filename;
				attachment.size = size;
				attachment.mime = file.mimetype;
				attachment.release = Promise.resolve(release);
				attachment.asset = asset;
				attachment.hash_sha1 = hash_sha1;
				attachment.hash_md5 = hash_md5;

				await this.service.save(attachment);

				this.ws.emit(repo, 'attachment_created', { attachment }, [
					'repo.releases.attachments.manage'
				]);

				return attachment;
			}
		}
		catch (err) {
			this.storage.delete(this.storage.getObjectName(repo, file.filename));
			throw err;
		}
	}

}
