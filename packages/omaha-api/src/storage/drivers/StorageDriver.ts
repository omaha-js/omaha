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
	 * @param name
	 *   The full name of the object in storage.
	 *
	 * @param stream
	 *   A readable stream for the file that will be consumed during upload. The source for the stream should be from
	 *   the application's temporary storage directory.
	 */
	write(name: string, size: number, stream: ReadStream): Promise<void>;

	/**
	 * Returns true if the specified file exists within the storage system.
	 *
	 * @param name The full name of the object in storage.
	 */
	exists(name: string): Promise<boolean>;

	/**
	 * Deletes the specified file from the storage system if it exists.
	 *
	 * @param name The full name of the object in storage.
	 */
	delete(name: string): Promise<void>;

	/**
	 * Generates a secure link to download the specified file. This link should expire after the specified duration.
	 * The client will be redirected to this link when attempting to download the file.
	 *
	 * @param name The full name of the object in storage.
	 * @param name The name of the file.
	 * @param duration The number of milliseconds (from now) until the link expires.
	 * @param disposition The original name of the file (optional).
	 * @returns
	 *   A link to the file with query parameters that enable temporary access. Depending on the storage driver, this
	 *   link may be either absolute or root-relative.
	 */
	getDownloadLink(name: string, duration: number, disposition?: string): Promise<string>;

}
