import { ReadStream } from 'typeorm/platform/PlatformTools';
import { StorageDriver, StorageMetaData } from '../interfaces/StorageDriver';
import { Logger } from '@nestjs/common';
import { Client, ItemBucketMetadata } from 'minio';
import { Env } from '@baileyherbert/env';

export class S3StorageDriver implements StorageDriver {

	private logger = new Logger('S3StorageDriver');
	private client!: Client;
	private bucket!: string;

	public async init(): Promise<void> {
		const env = Env.rules({
			STORAGE_S3_HOSTNAME: Env.schema.string(),
			STORAGE_S3_PORT: Env.schema.number().optional(443),
			STORAGE_S3_ACCESSKEY: Env.schema.string(),
			STORAGE_S3_SECRETKEY: Env.schema.string(),
			STORAGE_S3_BUCKET: Env.schema.string(),
			STORAGE_S3_SSL: Env.schema.boolean().optional(true),
		});

		this.bucket = env.STORAGE_S3_BUCKET;
		this.client = new Client({
			endPoint: env.STORAGE_S3_HOSTNAME,
			port: env.STORAGE_S3_PORT,
			useSSL: env.STORAGE_S3_SSL,
			accessKey: env.STORAGE_S3_ACCESSKEY,
			secretKey: env.STORAGE_S3_SECRETKEY
		});

		try {
			if (await this.client.bucketExists(this.bucket)) {
				this.logger.log(`Configured storage for S3 endpoint: ${env.STORAGE_S3_HOSTNAME}/${this.bucket}`);
			}
			else {
				throw new Error(`Bucket does not exist. Please check environment variable: STORAGE_S3_BUCKET`);
			}
		}
		catch (error) {
			this.logger.error(`Error when connecting to S3 endpoint: ${error}`);
			throw new Error('S3 storage configuration is invalid');
		}
	}

	public async write(name: string, stream: ReadStream, metadata?: StorageMetaData): Promise<void> {
		const meta: ItemBucketMetadata = {
			'Content-Type': 'application/octet-stream'
		};

		if (typeof metadata?.mime === 'string') {
			meta['Content-Type'] = metadata.mime;
		}

		if (typeof metadata?.size !== 'undefined') {
			meta['Content-Length'] = Number(metadata.size);
		}

		if (typeof metadata?.hash_sha1 === 'string') {
			meta['X-Bz-Content-Sha1'] = metadata.hash_sha1;
		}

		if (typeof metadata?.hash_md5 === 'string') {
			meta['Content-MD5'] = metadata.hash_md5;
		}

		return new Promise<void>((resolve, reject) => {
			stream.on('error', error => {
				stream.destroy();
				reject(error);
			});

			this.client.putObject(this.bucket, name, stream, meta).then(() => resolve(), reject);
		});
	}

	public async exists(name: string): Promise<boolean> {
		try {
			await this.client.statObject(this.bucket, name);
			return true;
		}
		catch (err) {
			console.log(err);
			return false;
		}
	}

	public async delete(name: string): Promise<void> {
		return this.client.removeObject(this.bucket, name);
	}

	public getDownloadLink(name: string, duration: number, disposition?: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const headers = {
				'Content-Disposition': disposition
			};

			this.client.presignedGetObject(this.bucket, name, Math.floor(duration / 1000), headers, function(err, url) {
				if (err) reject(err);
				else resolve(url);
			});
		});
	}

}
