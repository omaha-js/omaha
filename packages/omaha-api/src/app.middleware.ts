import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Environment } from './app.environment';
import { BaseToken } from './auth/tokens/models/BaseToken';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {

	private logger = new Logger('Http');

	use(request: Request, response: Response, next: NextFunction): void {
		if (Environment.APP_LOG_REQUESTS) {
			const { ip, method, originalUrl } = request;
			const start = Date.now();

			response.on('finish', () => {
				const { statusCode } = response;
				const took = Date.now() - start;
				const user = request.user as BaseToken | undefined;
				const auth = user ? (user.isDatabaseToken() ? 'token' : 'session') : 'public';

				this.logger.log(
					`${ip} "${method} ${originalUrl}" ${statusCode} ${took}ms ${auth}`
				);
			});
		}

		next();
	}
}
