import fs from 'fs';

/**
 * Resolves the stats of a file or returns `false` if an error occurs.
 *
 * @param path
 * @returns
 */
export async function stat(path: string): Promise<false | fs.Stats> {
	return await fs.promises.stat(path).catch(() => false);
}
