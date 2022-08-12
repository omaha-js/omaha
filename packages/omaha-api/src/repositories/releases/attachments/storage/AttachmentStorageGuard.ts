import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';
import { Repository } from 'src/entities/Repository';
import { StorageService } from 'src/storage/storage.service';
import { ReleasesService } from '../../releases.service';

@Injectable()
export class AttachmentStorageGuard implements CanActivate {

	public constructor(
		private readonly releases: ReleasesService,
		private readonly storage: StorageService,
	) {}

	public async canActivate(context: ExecutionContext) {
		const request: Request = context.switchToHttp().getRequest();
		const repo: Repository = (request as any)._guardedRepository;
		const version = request.params.version?.trim();
		const assetName = request.params.asset?.trim();

		const release = await this.releases.getFromVersionOrFail(repo, version);
		const asset = (await repo.assets).find(asset => asset.name.toLowerCase() === assetName.toLowerCase());
		const attachment = (await release.attachments).find(attachment => attachment.asset.id === asset?.id);

		// Preflight checks
		if (!asset) throw new NotFoundException(`The specified asset was not found in the repository`);
		if (release.status !== ReleaseStatus.Draft) throw new BadRequestException(`Cannot upload attachments to a published release`);

		// Save parameters for the storage engine
		(request as any)._attachRepository = repo;
		(request as any)._attachVersion = version;
		(request as any)._attachAssetName = assetName;
		(request as any)._attachRelease = release;
		(request as any)._attachAsset = asset;
		(request as any)._attachAttachment = attachment;
		(request as any)._storageService = this.storage;

		return true;
	}

}
