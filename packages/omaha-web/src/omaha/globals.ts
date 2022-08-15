import { Logger } from '@baileyherbert/logging';
import { Omaha } from '@omaha/client';

/**
 * The global logger. Don't use this directly, instead create a child first.
 */
export const logger = new Logger('App');
logger.createConsoleTransport();

/**
 * The global API client. Don't use this.
 */
export const client = new Omaha((new URL('/', document.URL)).href, {
	reattemptFailedCount: 0
});
