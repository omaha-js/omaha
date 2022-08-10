import { StorageDriver } from './interfaces/StorageDriver';
import { LocalStorageDriver } from './storage/LocalStorageDriver';
import { S3StorageDriver } from './storage/S3StorageDriver';

export enum StorageDriverType {

	/**
	 * Files will be stored in a local directory.
	 */
	Local = 'local',

	/**
	 * Files will be stored on a remote, S3-compatible storage service.
	 */
	S3 = 's3',

}

export const StorageDrivers: Record<StorageDriverType, StorageDriver> = {
	local: new LocalStorageDriver(),
	s3: new S3StorageDriver(),
};
