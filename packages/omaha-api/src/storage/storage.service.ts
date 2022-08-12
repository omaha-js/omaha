import { Injectable, OnModuleInit } from '@nestjs/common';
import { Environment } from 'src/app.environment';
import { Repository } from 'src/entities/Repository';
import { LocalStorageDriver } from '../drivers/storage/LocalStorageDriver';
import { S3StorageDriver } from '../drivers/storage/S3StorageDriver';
import { StorageDriver, StorageMetaData } from '../drivers/interfaces/StorageDriver';
import { StorageDriverType } from 'src/drivers/storage';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {

	private driver!: StorageDriver;

	/**
	 * Resolves and initializes the storage driver.
	 */
	public async onModuleInit() {
		this.driver = this.createDriverInstance();
		await this.driver.init();
	}

	/**
	 * Resolves a singleton instance of the configured driver.
	 */
	private createDriverInstance(): StorageDriver {
		switch (Environment.STORAGE_DRIVER) {
			case StorageDriverType.Local: return new LocalStorageDriver();
			case StorageDriverType.S3: return new S3StorageDriver();
		}

		throw new Error(`Unknown storage driver "${Environment.STORAGE_DRIVER}"`);
	}

	/**
	 * Writes a file to storage from a readstream.
	 *
	 * @param name
	 *   The full name of the object in storage.
	 *
	 * @param stream
	 *   A readable stream for the file that will be consumed during upload. The source for the stream should be from
	 *   the application's temporary storage directory.
	 *
	 * @param metadata
	 *   Additional metadata for the file upload.
	 */
	public write(name: string, stream: Readable, metadata?: StorageMetaData): Promise<void> {
		return this.driver.write(name, stream, metadata);
	}

	/**
	 * Returns true if the specified file exists within the storage system.
	 *
	 * @param name The full name of the object in storage.
	 */
	public exists(name: string): Promise<boolean> {
		return this.driver.exists(name);
	}

	/**
	 * Deletes the specified file from the storage system if it exists.
	 *
	 * @param name The full name of the object in storage.
	 */
	public delete(name: string): Promise<void> {
		return this.driver.delete(name);
	}

	/**
	 * Generates a secure link to download the specified file. This link should expire after the specified duration.
	 * The client will be redirected to this link when attempting to download the file.
	 *
	 * @param name The full name of the object in storage.
	 * @param duration The number of milliseconds (from now) until the link expires.
	 * @param disposition The original name of the file (optional).
	 * @returns
	 *   A link to the file with query parameters that enable temporary access. Depending on the storage driver, this
	 *   link may be either absolute or root-relative.
	 */
	public getDownloadLink(name: string, duration: number, disposition?: string): Promise<string> {
		return this.driver.getDownloadLink(name, duration, disposition);
	}

	/**
	 * Returns the underlying storage driver. Use with caution.
	 *
	 * @returns
	 */
	public getDriver() {
		return this.driver;
	}

	/**
	 * Builds an object name for storage from the given repository and file name.
	 *
	 * @param repository
	 * @param fileName
	 * @returns
	 */
	public getObjectName(repository: Repository, fileName: string) {
		return `${repository.id}/${fileName}`;
	}

}
