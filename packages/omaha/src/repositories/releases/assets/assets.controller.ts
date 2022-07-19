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
import { AssetsService } from './assets.service';

@Controller('repositories/:repo_id/releases/:version/:asset')
@UseGuards(RepositoriesGuard)
export class AssetsController {

	private logger = new Logger(this.constructor.name);

	public constructor(
		private readonly assets: AssetsService,
		private readonly releases: ReleasesService,
		private readonly storage: StorageService
	) {}

	/**
	 * Reads an asset.
	 *
	 * @param repo
	 * @param version
	 * @param assetName
	 * @returns
	 */
	@Get()
	public async getAsset(@Repo() repo: Repository, @Param('version') version: string, @Param('asset') assetName: string) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const asset = (await release.assets).find(asset => asset.asset.name.toLowerCase() === assetName.toLowerCase());

		if (!asset) {
			throw new NotFoundException(`The specified asset was not found in the release`);
		}

		return asset;
	}

	@Post()
	@UseScopes('repo.assets.manage')
	@UseInterceptors(FileInterceptor('file', { dest: Environment.TEMP_DIRNAME }))
	public async uploadAsset(@Repo() repo: Repository, @Param('version') version: string, @Param('asset') assetName: string, @UploadedFile() file: Express.Multer.File) {
		const release = await this.releases.getFromVersionOrFail(repo, version);
		const repoAsset = (await repo.assets).find(asset => asset.name.toLowerCase() === assetName.toLowerCase());
		const releaseAsset = (await release.assets).find(asset => asset.asset.id === repoAsset.id);

		// Preflight checks
		if (!file) throw new BadRequestException(`Missing file upload`);
		if (!repoAsset) throw new NotFoundException(`The specified asset was not found in the repository`);
		if (!release.draft) throw new BadRequestException(`Cannot upload assets to a published release`);

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

			// Update an existing release asset
			if (releaseAsset) {
				releaseAsset.file_name = file.originalname,
				releaseAsset.object_name = saveName;
				releaseAsset.mime = file.mimetype;
				releaseAsset.size = file.size;

				return await this.assets.save(releaseAsset);
			}

			// Create a new release asset
			else {
				const asset = await this.assets.create();
				asset.file_name = file.originalname;
				asset.object_name = saveName;
				asset.size = file.size;
				asset.mime = file.mimetype;
				asset.release = Promise.resolve(release);
				asset.asset = repoAsset;

				return await this.assets.save(asset);
			}
		}
		catch (err) {
			this.logger.error('Asset upload failed:', err);

			try { await fs.promises.unlink(file.path); }
			catch (err) {}

			throw new InternalServerErrorException();
		}
	}

}
