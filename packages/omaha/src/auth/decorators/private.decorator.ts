import { SetMetadata } from '@nestjs/common';

/**
 * Marks the endpoint as "private" meaning it cannot be accessed without authorization.
 *
 * @returns
 */
 export function Private() {
	return SetMetadata('auth.private', true);
}
