import { BadRequestException, Controller, Get, InternalServerErrorException, Logger, NotFoundException, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Repository } from 'src/entities/Repository';
import { RepositoriesGuard } from 'src/repositories/repositories.guard';
import { Repo } from 'src/support/Repo';
import { ReleasesService } from '../releases.service';
import fs from 'fs';
import { Environment } from 'src/app.environment';
import { StorageService } from 'src/storage/storage.service';
import { AttachmentsService } from './attachments.service';

@Controller('repositories/:repo_id/releases/:version/:asset')
@UseGuards(RepositoriesGuard)
export class AttachmentsController {

	private logger = new Logger(this.constructor.name);

	public constructor(
		private readonly assets: AttachmentsService,
		private readonly releases: ReleasesService,
		private readonly storage: StorageService
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
	public async downloadAttachment(@Repo() repo: Repository, @Param('version') version: string, @Param('asset') assetName: string) {
		const expiration = 3600000;
		const attachment = await this.getAttachment(repo, version, assetName);
		const release = await attachment.release;

		const name = `${release.version}/${attachment.asset.name}`;
		const url = await this.storage.getDownloadLink(repo, name, expiration);

		return {
			file_name: attachment.file_name,
			mime: attachment.mime,
			size: attachment.size,
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

				return await this.assets.save(attachment);
			}

			// Create a new attachment
			else {
				const attachment = await this.assets.create();
				attachment.file_name = file.originalname;
				attachment.object_name = saveName;
				attachment.size = file.size;
				attachment.mime = file.mimetype;
				attachment.release = Promise.resolve(release);
				attachment.asset = repoAsset;

				return await this.assets.save(attachment);
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
