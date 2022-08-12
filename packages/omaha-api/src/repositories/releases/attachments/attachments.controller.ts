import { BadRequestException, Controller, ForbiddenException, Get, InternalServerErrorException, Logger, NotFoundException, Param, Post, Req, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { QueueService } from '../queue/queue.service';
import { exists } from 'src/support/utilities/exists';
import { ReleaseAttachmentStatus } from 'src/entities/enum/ReleaseAttachmentStatus';
import { RealtimeService } from 'src/realtime/realtime.service';
import fs from 'fs';
import crypto from 'crypto';
import { ObjectNotFoundError } from 'src/storage/errors/ObjectNotFoundError';
import { PassThrough } from 'stream';
import { RepositoryAccessType } from 'src/entities/enum/RepositoryAccessType';

@Controller('repositories/:repo_id/releases/:version/:asset')
@UseGuards(RepositoriesGuard)
export class AttachmentsController {

	private logger = new Logger(this.constructor.name);

	public constructor(
		private readonly service: AttachmentsService,
		private readonly releases: ReleasesService,
		private readonly storage: StorageService,
		private readonly downloads: DownloadsService,
		private readonly queue: QueueService,
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

		if (release.status === ReleaseStatus.Draft && !collab?.hasPermission('repo.releases.attachments.manage')) {
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
				!collab?.hasPermission('repo.releases.attachments.download') ||
				!token?.hasPermission('repo.releases.attachments.download')
			) {
				throw new ForbiddenException('You do not have access to this endpoint');
			}
		}

		const expiration = 600000;
		const attachment = await this.getAttachment(repo, version, assetName, collab);
		const disposition = `attachment; filename="${attachment.file_name}"`;
		const release = await attachment.release;

		if (release.status === ReleaseStatus.Archived) {
			if (!collab?.hasPermission('repo.releases.attachments.manage')) {
				throw new BadRequestException('Archived releases cannot be downloaded');
			}

			if (release.purged_at) {
				throw new BadRequestException(
					'The files for this release have been purged and can no longer be downloaded'
				);
			}
		}

		if (attachment.status !== ReleaseAttachmentStatus.Ready) {
			throw new BadRequestException('This release has not finished processing, try again shortly');
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
	 * @param repo
	 * @param version
	 * @param assetName
	 * @param file
	 * @returns
	 */
	@Post()
	@UseScopes('repo.releases.attachments.manage')
	@UseInterceptors(FileInterceptor('file', { dest: Environment.TEMP_DIRNAME }))
	public async uploadAttachment(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Param('asset') assetName: string,
		@UploadedFile() file: Express.Multer.File
	) {
		try {
			const release = await this.releases.getFromVersionOrFail(repo, version);
			const asset = (await repo.assets).find(asset => asset.name.toLowerCase() === assetName.toLowerCase());
			const attachment = (await release.attachments).find(attachment => attachment.asset.id === asset?.id);

			// Preflight checks
			if (!file) throw new BadRequestException(`Missing file upload`);
			if (!asset) throw new NotFoundException(`The specified asset was not found in the repository`);
			if (release.status !== ReleaseStatus.Draft) throw new BadRequestException(`Cannot upload attachments to a published release`);

			// Make sure the file exists
			if (!await exists(file.path)) {
				throw new InternalServerErrorException('File not found (internal)');
			}

			// Create the read stream
			const stream = fs.createReadStream(file.path);
			const pass = new PassThrough();

			// Compute hashes for the file using the stream
			const sha1 = crypto.createHash('sha1', { encoding: 'binary' });
			const md5 = crypto.createHash('md5', { encoding: 'binary' });
			const promise = new Promise<void>(r => pass.once('end', r));

			pass.on('data', chunk => {
				sha1.update(chunk);
				md5.update(chunk);
			});

			stream.pipe(pass);

			// Wait for hashing
			await promise;

			// Update an existing attachment
			if (attachment) {
				if (attachment.status === ReleaseAttachmentStatus.Pending) {
					throw new BadRequestException('This attachment is currently pending, please try again shortly');
				}

				// Delete old objects
				if (typeof attachment.object_name === 'string') {
					try {
						await this.storage.delete(this.storage.getObjectName(repo, attachment.object_name));
					}
					catch (err) {
						if (!(err instanceof ObjectNotFoundError)) {
							this.logger.error('Failed to delete old object', err);
						}
					}
				}

				attachment.file_name = file.originalname,
				attachment.object_name = null;
				attachment.mime = file.mimetype;
				attachment.size = file.size;
				attachment.hash_sha1 = sha1.digest();
				attachment.hash_md5 = md5.digest();
				attachment.status = ReleaseAttachmentStatus.Pending;

				await attachment.release;
				this.ws.emit(repo, 'attachment_updated', { attachment }, [
					'repo.releases.attachments.manage'
				]);

				await this.service.save(attachment);
				await this.queue.addAttachmentUpload(attachment, file.path);

				return attachment;
			}

			// Create a new attachment
			else {
				const attachment = await this.service.create();
				attachment.file_name = file.originalname;
				attachment.object_name = null;
				attachment.size = file.size;
				attachment.mime = file.mimetype;
				attachment.release = Promise.resolve(release);
				attachment.asset = asset;
				attachment.hash_sha1 = sha1.digest();
				attachment.hash_md5 = md5.digest();
				attachment.status = ReleaseAttachmentStatus.Pending;

				await this.service.save(attachment);

				this.ws.emit(repo, 'attachment_created', { attachment }, [
					'repo.releases.attachments.manage'
				]);

				await this.queue.addAttachmentUpload(attachment, file.path);

				return attachment;
			}
		}
		catch (err) {
			try { await fs.promises.unlink(file.path); }
			catch (err) {}

			if (err instanceof BadRequestException || err instanceof InternalServerErrorException || err instanceof NotFoundException) {
				throw err;
			}

			this.logger.error('Attachment upload failed:', err);
			throw new InternalServerErrorException();
		}
	}

}
