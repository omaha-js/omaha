import { Environment } from 'src/app.environment';
import path from 'path';

export function getAppLink(...segments: any[]) {
	const result = path.join(...segments).replaceAll(path.sep, '/').replace(/^\/+/, '');
	const url = new URL(result, Environment.APP_URL);
	return url.href;
}
