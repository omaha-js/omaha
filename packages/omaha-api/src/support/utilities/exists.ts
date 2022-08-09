import fs from 'fs';

/**
 * Resolves to `true` if the specified path exists or `false` otherwise.
 *
 * @param path
 * @returns
 */
export const exists = async (path: string) => !!(await fs.promises.stat(path).catch(e => false));
