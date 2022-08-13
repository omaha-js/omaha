import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';
import { StorageEngine } from 'multer';
import { Asset } from 'src/entities/Asset';
import { Release } from 'src/entities/Release';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { Repository } from 'src/entities/Repository';
import { StorageService } from 'src/storage/storage.service';
import { createHashTransform } from 'src/support/streams/HashTransformStream';
import * as uuid from 'uuid';

export class AttachmentStorageEngine implements StorageEngine {

	public _handleFile(req: Request, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File>) => void) {
		this.upload(req, file)
			.then(() => cb(null, file))
			.catch(error => this._removeFile(req, file, () => cb(error)));
	}

	public _removeFile(request: Request, file: Express.Multer.File, cb: (error: Error | null) => void) {
		const repo: Repository = (request as any)._attachRepository;
		const storage: StorageService = (request as any)._storageService;

		if (repo && storage && file.filename) {
			storage.delete(storage.getObjectName(repo, file.filename))
		}

		cb(null);
	}

	private async upload(request: Request, file: Express.Multer.File): Promise<void> {
		const repo: Repository = (request as any)._attachRepository;
		const release: Release = (request as any)._attachRelease;
		const asset: Asset = (request as any)._attachAsset;
		const attachment: ReleaseAttachment = (request as any)._attachAttachment;
		const storage: StorageService = (request as any)._storageService;

		const sizeInput = request.body.file_size as string | undefined;
		const sha1Input = request.body.hash_sha1 as string | undefined;
		const md5Input = request.body.hash_md5 as string | undefined;

		if (!repo) throw new InternalServerErrorException('Failed to hit guard');
		if (file.fieldname !== 'file') throw new BadRequestException(`Invalid file field '${file.fieldname}'`);
		if (typeof sizeInput === 'string' && isNaN(Number(sizeInput))) throw new BadRequestException(`Invalid value for field 'file_size'`);
		if (typeof sha1Input === 'string' && sha1Input.trim().length !== 40) throw new BadRequestException(`Invalid value for field 'hash_sha1'`);
		if (typeof md5Input === 'string' && md5Input.trim().length !== 32) throw new BadRequestException(`Invalid value for field 'hash_md5'`);

		const size = typeof sizeInput === 'string' ? Number(sizeInput) : undefined;
		const hash_sha1 = typeof sha1Input === 'string' ? sha1Input.trim() : undefined;
		const hash_md5 = typeof md5Input === 'string' ? md5Input.trim() : undefined;
		const objectName = file.filename = `${release.version}/${asset.name}-${uuid.v4()}`;
		const mime = file.mimetype ?? 'application/octet-stream';

		const hasher = createHashTransform({
			expectedSize: size,
			expectedHashMD5: hash_md5?.toLowerCase(),
			expectedHashSHA1: hash_sha1?.toLowerCase(),
		});

		const stream = file.stream.pipe(hasher.transform);
		await storage.write(storage.getObjectName(repo, objectName), stream, {
			size,
			hash_md5,
			hash_sha1,
			mime
		});

		(request as any)._attachFileReady = true;
		(request as any)._attachHashSHA1 = hasher.hash_sha1;
		(request as any)._attachHashMD5 = hasher.hash_md5;
		(request as any)._attachFileSize = hasher.size;
	}

}
