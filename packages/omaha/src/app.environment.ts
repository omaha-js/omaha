import { Env } from '@baileyherbert/env';
import { StorageDriverType } from './storage/drivers';

export const Environment = Env.rules({

	/// =======================================================
	/// == Application
	/// =======================================================

	/**
	 * The public name of the application.
	 */
	APP_NAME: Env.schema.string().optional('Omaha'),

	/**
	 * A strong, secure, random secret string for encryption and payload signing.
	 */
	APP_SECRET: Env.schema.string(),

	/**
	 * The public URL of the application (trailing slash is optional).
	 */
	APP_URL: Env.schema.string().optional('http://localhost:3000'),

	/// =======================================================
	/// == Database
	/// =======================================================

	/**
	 * The type of database server to use.
	 */
	DATABASE_TYPE: Env.schema.enum(['mysql', 'mariadb'] as const).optional('mysql'),

	/**
	 * The hostname to use for the database.
	 */
	DATABASE_HOST: Env.schema.string().optional('localhost'),

	/**
	 * The port to use for the database.
	 */
	DATABASE_PORT: Env.schema.number().optional(3306),

	/**
	 * The username to use for the database connection.
	 */
	DATABASE_USERNAME: Env.schema.string(),

	/**
	 * The password to use for the database connection.
	 */
	DATABASE_PASSWORD: Env.schema.string(),

	/**
	 * The name of the database to target.
	 */
	DATABASE_NAME: Env.schema.string(),

	/// =======================================================
	/// == Storage
	/// =======================================================

	/**
	 * The name of a directory to use for temporary file uploads.
	 */
	TEMP_DIRNAME: Env.schema.string().optional('temp'),

	/**
	 * The storage driver to use.
	 */
	STORAGE_DRIVER: Env.schema.enum(StorageDriverType),

	/**
	 * The name of the directory to use for storing files.
	 */
	STORAGE_LOCAL_DIRNAME: Env.schema.string().optional('storage'),

	/**
	 * The hostname or URL of the endpoint to use for storage.
	 */
	STORAGE_S3_HOSTNAME: Env.schema.string().optional(),

	/**
	 * The port number to use. Defaults to 80 for HTTP and 443 for HTTPS.
	 */
	STORAGE_S3_PORT: Env.schema.number().optional(),

	/**
	 * The access key (user ID) for the storage account.
	 */
	STORAGE_S3_ACCESSKEY: Env.schema.string().optional(),

	/**
	 * The secret key (password) for the storage account.
	 */
	STORAGE_S3_SECRETKEY: Env.schema.string().optional(),

	/**
	 * Whether or not to use SSL for the connection.
	 */
	STORAGE_S3_SSL: Env.schema.boolean().optional(true),

	/**
	 * The maximum number of simultaneous uploads allowed for the storage driver.
	 */
	STORAGE_MAX_CONCURRENT_UPLOADS: Env.schema.number().optional(5),

});
