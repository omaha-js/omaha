import { Transform } from 'stream';
import { BadRequestException } from '@nestjs/common';
import crypto from 'crypto';

export function createHashTransform(options: HashTransformOptions): HashTransformResponse {
	const sha1 = crypto.createHash('sha1', { encoding: 'binary' });
	const md5 = crypto.createHash('md5', { encoding: 'binary' });
	const response: Partial<HashTransformResponse> = {
		size: 0,
		hash_md5: Buffer.alloc(16),
		hash_sha1: Buffer.alloc(20)
	};

	response.transform = new Transform({
		transform(this, chunk, encoding, callback) {
			sha1.update(chunk, encoding);
			md5.update(chunk, encoding);
			response.size += chunk.length;

			callback(null, chunk);
		},

		flush(this, callback) {
			response.hash_md5 = md5.digest();
			response.hash_sha1 = sha1.digest();

			if (typeof options.expectedSize === 'number' && response.size !== options.expectedSize) {
				return callback(createSizeError(options.expectedSize, response.size!));
			}

			if (typeof options.expectedHashMD5 === 'string' && response.hash_md5.toString('hex') !== options.expectedHashMD5) {
				return callback(createHashError('MD5', options.expectedHashMD5, response.hash_md5.toString('hex')));
			}

			if (typeof options.expectedHashSHA1 === 'string' && response.hash_sha1.toString('hex') !== options.expectedHashSHA1) {
				return callback(createHashError('SHA1', options.expectedHashSHA1, response.hash_sha1.toString('hex')));
			}

			return callback();
		},
	})

	return response as HashTransformResponse;
}

function createSizeError(expected: number, received: number) {
	return new BadRequestException(
		`File size mismatch (expected ${expected} bytes, received ${received})`
	);
}

function createHashError(algorithm: string, expected: string, received: string) {
	return new BadRequestException(`${algorithm} checksum mismatch`);
}

interface HashTransformOptions {
	/**
	 * The expected size of the stream in bytes.
	 */
	expectedSize?: number;

	/**
	 * The expected SHA-1 checksum of the stream in hexadecimal format.
	 */
	expectedHashSHA1?: string;

	/**
	 * The expected MD5 checksum of the stream in hexadecimal format.
	 */
	expectedHashMD5?: string;
}

interface HashTransformResponse {
	transform: Transform;
	hash_sha1: Buffer;
	hash_md5: Buffer;
	size: number;
}
