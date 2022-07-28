import { ReadStream } from 'fs';
import { Repository } from 'src/entities/Repository';

/**
 * This interface defines a storage driver.
 */
export interface StorageDriver {

	/**
	 * Initializes the storage driver. The driver should throw errors at this stage if there are any connection or
	 * configuration issues.
	 */
	init(): Promise<void>;

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
	write(repo: Repository, name: string, stream: ReadStream): Promise<string>;

	/**
	 * Returns true if the specified file exists within the storage system.
	 *
	 * @param repo The repository the file belongs to.
	 * @param name The name of the file.
	 */
	exists(repo: Repository, name: string): Promise<boolean>;

	/**
	 * Deletes the specified file from the storage system if it exists.
	 *
	 * @param repo The repository the file belongs to.
	 * @param name The name of the file.
	 */
	delete(repo: Repository, name: string): Promise<void>;

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
	getDownloadLink(repo: Repository, name: string, duration: number, disposition?: string): Promise<string>;

}
