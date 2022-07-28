import { Injectable, OnModuleInit } from '@nestjs/common';
import { ReadStream } from 'fs';
import { Environment } from 'src/app.environment';
import { Repository } from 'src/entities/Repository';
import { StorageDriverType } from './drivers';
import { LocalStorageDriver } from './drivers/LocalStorageDriver';
import { S3StorageDriver } from './drivers/S3StorageDriver';
import { StorageDriver } from './drivers/StorageDriver';

@Injectable()
export class StorageService implements OnModuleInit {

	private driver: StorageDriver;

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
	}

	/**
	 * Writes a file to storage from a readstream.
	 *
	 * @param repo
	 *   The repository that this file belongs to. This could be used to organize and group files within the storage
	 *   system by their associated repository.
	 *
	 * @param name
	 *   The name to use for the file in storage.
	 *
	 * @param stream
	 *   A readable stream for the file that will be consumed during upload. The source for the stream should be from
	 *   the application's temporary storage directory.
	 *
	 * @returns
	 *   The relative name of the file within the storage system. This should be stored as it will be required to
	 *   access and manage the file later.
	 */
	public write(repo: Repository, name: string, stream: ReadStream): Promise<string> {
		return this.driver.write(repo, name, stream);
	}

	/**
	 * Returns true if the specified file exists within the storage system.
	 *
	 * @param repo The repository the file belongs to.
	 * @param name The name of the file.
	 */
	public exists(repo: Repository, name: string): Promise<boolean> {
		return this.driver.exists(repo, name);
	}

	/**
	 * Deletes the specified file from the storage system if it exists.
	 *
	 * @param repo The repository the file belongs to.
	 * @param name The name of the file.
	 */
	public delete(repo: Repository, name: string): Promise<void> {
		return this.driver.delete(repo, name);
	}

	/**
	 * Generates a secure link to download the specified file. This link should expire after the specified duration.
	 * The client will be redirected to this link when attempting to download the file.
	 *
	 * @param repo The repository the file belongs to.
	 * @param name The name of the file.
	 * @param duration The number of milliseconds (from now) until the link expires.
	 * @param disposition The original name of the file (optional).
	 * @returns
	 *   A link to the file with query parameters that enable temporary access. Depending on the storage driver, this
	 *   link may be either absolute or root-relative.
	 */
	public getDownloadLink(repo: Repository, name: string, duration: number, disposition?: string): Promise<string> {
		return this.driver.getDownloadLink(repo, name, duration, disposition);
	}

	/**
	 * Returns the underlying storage driver. Use with caution.
	 *
	 * @returns
	 */
	public getDriver() {
		return this.driver;
	}

}
