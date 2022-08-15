import omaha from '.';
import { Manager } from './framework/Manager';
import { createStore } from './helpers/stores';

/**
 * Whether or not the application has been fully bootstrapped.
 */
export const bootstrapped = createStore(false);

/**
 * Bootstraps the application and all of its managers.
 */
export async function bootstrap() {
	for (const key in omaha) {
		const value = (omaha as any)[key];

		if (value instanceof Manager) {
			await (value as any).bootstrap();
		}
	}

	bootstrapped.set(true);
}
