import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';
import './app.environment';
import { TrimPipe } from './support/TrimPipe';
import { ClassSerializerInterceptor, LoggerService, ValidationPipe, VersioningType } from '@nestjs/common';
import { CustomLogger } from './app.logger';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		logger: new CustomLogger()
	});

	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '1'
	});

	/**
	 * The following code will attach the admin panel's vite server while omaha is running in dev mode.
	 */
	if (process.env.NODE_ENV !== 'production') {
		const proxy = createProxyMiddleware({
			target: 'http://localhost:3001',
			changeOrigin: true,
			logLevel: 'warn'
		});

		app.use('/', function(req: Request, res: Response, next: NextFunction) {
			if (!/^\/v\d+\//.test(req.url)) {
				return proxy(req, res, next);
			}

			next();
		});

		// TODO: Implement the logic for production.
	}

	app.useGlobalPipes(new TrimPipe());
	app.useGlobalPipes(new ValidationPipe({
		forbidUnknownValues: true,
		skipMissingProperties: false,
		skipUndefinedProperties: false,
		stopAtFirstError: true
	}));

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector), {
		excludePrefixes: ['_']
	}));

	app.enableShutdownHooks();

	await app.listen(3000);
}

bootstrap();
