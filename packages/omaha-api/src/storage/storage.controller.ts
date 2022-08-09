import { Controller, ForbiddenException, Get, NotFoundException, Param, Query, StreamableFile } from '@nestjs/common';
import { Guest } from 'src/auth/decorators/guest.decorator';
import { DownloadQueryDto } from './dto/DownloadQueryDto';
import { StorageService } from './storage.service';
import { LocalStorageDriver } from './drivers/LocalStorageDriver';
import { stat } from 'src/support/utilities/stat';
import fs from 'fs';
import path from 'path';

@Controller('storage')
export class StorageController {

	public constructor(
		private readonly service: StorageService
	) {}

	@Get('download/:objectName(((?:[^/]+/){0,}(?:[^/]+)))')
	@Guest()
	public async getAuthorizedFile(@Param('objectName') objectName: string, @Query() query: DownloadQueryDto) {
		const driver = this.service.getDriver();
		const expiration = Number(query.expires);

		if (!(driver instanceof LocalStorageDriver)) throw new NotFoundException();
		if (isNaN(expiration)) throw new ForbiddenException('Invalid expiration timestamp');
		if (Date.now() >= (expiration * 1000)) throw new ForbiddenException('Download link has expired');

		const signature = driver.getDownloadSignature(objectName, query.expires, query.disposition);

		if (signature !== query.signature) {
			throw new ForbiddenException('Incorrect signature');
		}

		const objectPath = path.resolve(driver.storagePath, objectName);
		const objectStats = await stat(objectPath);

		if (!objectStats) {
			throw new ForbiddenException('Object not found');
		}

		const stream = fs.createReadStream(objectPath);

		return new StreamableFile(stream, {
			disposition: query.disposition,
			length: objectStats.size
		});
	}

}
