import { SetMetadata } from '@nestjs/common';

/**
 * Sets the controller or route handler to allow non-authenticated requests.
 *
 * @param allowAuthentication When false, requests will be rejected if they are authenticated (defaults to `true`).
 * @returns
 */
export function Guest(allowAuthentication = true) {
	return SetMetadata('auth.guest', allowAuthentication);
}
