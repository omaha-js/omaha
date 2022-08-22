import { Environment } from 'src/app.environment';
import path from 'path';

export function getAppLink(...segments: any[]) {
	let search: Record<string, string> | undefined;

	if (typeof segments[segments.length - 1] === 'object') {
		search = segments.pop();
	}

	const result = path.join(...segments).replaceAll(path.sep, '/').replace(/^\/+/, '');
	const url = new URL(result, Environment.APP_URL);

	if (search) {
		for (const key in search) {
			url.searchParams.append(key, search[key]);
		}
	}

	return url.href;
}
