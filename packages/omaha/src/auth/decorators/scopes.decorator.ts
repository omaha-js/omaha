import { SetMetadata } from '@nestjs/common';
import { AuthScopeId } from '../auth.scopes';

/**
 * Sets the required token scope(s) for a controller or route handler.
 *
 * @param scopes
 * @returns
 */
export function UseScopes(...scopes: AuthScopeId[]) {
	return SetMetadata('auth.scopes', scopes);
}
