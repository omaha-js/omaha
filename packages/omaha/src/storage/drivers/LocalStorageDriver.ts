import { Environment } from 'src/app.environment';
import { Repository } from 'src/entities/Repository';
import { ReadStream } from 'typeorm/platform/PlatformTools';
import { StorageDriver } from '../../storage/drivers/StorageDriver';
import { Logger } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exists } from 'src/support/utilities/exists';

export class LocalStorageDriver implements StorageDriver {

	public storagePath: string;
	private logger = new Logger('LocalStorageDriver');

	public async init(): Promise<void> {
		this.storagePath = path.resolve(Environment.STORAGE_LOCAL_DIRNAME);
		this.logger.log('Configured storage for local directory: ' + this.storagePath);

		if (!fs.existsSync(this.storagePath)) {
			fs.mkdirSync(this.storagePath);
		}
	}

	public async write(repo: Repository, name: string, stream: ReadStream): Promise<string> {
		const targetPath = path.resolve(this.storagePath, repo.id, name);
		const targetDir = path.dirname(targetPath);

		if (!await exists(targetDir)) {
			await fs.promises.mkdir(targetDir, { recursive: true });
		}

		const target = fs.createWriteStream(targetPath, { encoding: 'binary' });
		const finished = new Promise(fulfill => stream.on('end', fulfill));

		stream.pipe(target);
		await finished;

		return name;
	}

	public exists(repo: Repository, name: string): Promise<boolean> {
		const targetPath = path.resolve(this.storagePath, repo.id, name);
		return exists(targetPath);
	}

	public delete(repo: Repository, name: string): Promise<void> {
		throw new Error('Method not implemented.');
	}

	public async getDownloadLink(repo: Repository, name: string, duration: number, disposition?: string): Promise<string> {
		const objectName = `${repo.id}/${name}`;
		const url = new URL('v1/storage/download/' + objectName, Environment.APP_URL);
		const expiration = Math.ceil((Date.now() + duration) / 1000);
		const signature = this.getDownloadSignature(objectName, expiration, disposition);

		url.searchParams.append('signature', signature);
		url.searchParams.append('expires', expiration.toString());

		if (typeof disposition === 'string') {
			url.searchParams.append('disposition', disposition);
		}

		return url.href;
	}

	/**
	 * Generates and returns a `sha256` hash to sign the given download parameters.
	 *
	 * @param repoId
	 * @param fileName
	 * @param expiration
	 * @param disposition
	 * @returns
	 */
	public getDownloadSignature(fileName: string, expiration: number, disposition?: string) {
		const secret = JSON.stringify({
			secret: Environment.APP_SECRET,
			fileName,
			expiration: Number(expiration),
			disposition
		});

		return crypto.createHash('sha512').update(secret).digest('base64');
	}

}
