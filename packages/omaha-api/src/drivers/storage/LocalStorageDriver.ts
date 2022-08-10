import { Environment } from 'src/app.environment';
import { ReadStream } from 'typeorm/platform/PlatformTools';
import { StorageDriver } from '../interfaces/StorageDriver';
import { Logger } from '@nestjs/common';
import { exists } from 'src/support/utilities/exists';
import { ObjectNotFoundError } from '../../storage/errors/ObjectNotFoundError';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export class LocalStorageDriver implements StorageDriver {

	public storagePath!: string;
	private logger = new Logger('LocalStorageDriver');

	public async init(): Promise<void> {
		this.storagePath = path.resolve(Environment.STORAGE_LOCAL_DIRNAME);
		this.logger.log('Configured storage for local directory: ' + this.storagePath);

		if (!fs.existsSync(this.storagePath)) {
			fs.mkdirSync(this.storagePath);
		}
	}

	public async write(name: string, size: number, stream: ReadStream): Promise<void> {
		const targetPath = path.resolve(this.storagePath, name);
		const targetDir = path.dirname(targetPath);

		if (!await exists(targetDir)) {
			await fs.promises.mkdir(targetDir, { recursive: true });
		}

		const target = fs.createWriteStream(targetPath, { encoding: 'binary' });
		const finished = new Promise(fulfill => stream.on('end', fulfill));

		stream.pipe(target);
		await finished;
	}

	public exists(name: string): Promise<boolean> {
		const targetPath = path.resolve(this.storagePath, name);
		return exists(targetPath);
	}

	public async delete(name: string): Promise<void> {
		const targetPath = path.resolve(this.storagePath, name);

		if (!await exists(targetPath)) {
			throw new ObjectNotFoundError('Target object does not exist: ' + name);
		}

		return fs.promises.unlink(targetPath);
	}

	public async getDownloadLink(name: string, duration: number, disposition?: string): Promise<string> {
		const url = new URL('v1/storage/download/' + name, Environment.APP_URL);
		const expiration = Math.ceil((Date.now() + duration) / 1000);
		const signature = this.getDownloadSignature(name, expiration, disposition);

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
