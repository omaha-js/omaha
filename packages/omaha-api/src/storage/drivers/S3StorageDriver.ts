import { ReadStream } from 'typeorm/platform/PlatformTools';
import { StorageDriver } from '../../storage/drivers/StorageDriver';
import { Logger } from '@nestjs/common';
import { Client } from 'minio';
import { Env } from '@baileyherbert/env';

export class S3StorageDriver implements StorageDriver {

	private logger = new Logger('S3StorageDriver');
	private client: Client;
	private bucket: string;

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
			this.logger.error(`Error when connecting to S3 endpoint: ${error.message}`);
			throw new Error('S3 storage configuration is invalid');
		}
	}

	public async write(name: string, size: number, stream: ReadStream): Promise<void> {
		await this.client.putObject(this.bucket, name, stream, size);
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
