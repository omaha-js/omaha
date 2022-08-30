import 'source-map-support/register';
import './app.environment';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';
import { TrimPipe } from './support/TrimPipe';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { CustomLogger, logger } from './app.logger';
import { EntityNotFoundExceptionFilter } from './support/filters/entities';
import { Environment } from './app.environment';

async function bootstrap() {
	logger.info('Starting omaha service (tag: %s)', Environment.TAG);

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
	}

	app.useGlobalFilters(new EntityNotFoundExceptionFilter());

	app.useGlobalPipes(new TrimPipe());
	app.useGlobalPipes(new ValidationPipe({
		transform: true,
		forbidUnknownValues: true,
		skipMissingProperties: false,
		skipUndefinedProperties: false,
		stopAtFirstError: true
	}));

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector), {
		excludePrefixes: ['_']
	}));

	app.enableShutdownHooks();

	app.enableCors({
		origin: '*',
		allowedHeaders: 'Content-Type, Accept, Authorization'
	});

	if (typeof Environment.APP_TRUSTED_PROXY !== 'undefined') {
		app.set('trust proxy', Environment.APP_TRUSTED_PROXY);
	}

	await app.listen(3000);

	if (typeof global.gc === 'function') {
		const runGarbageCollector = () => {
			const start = Date.now(); gc!();
			const end = Date.now(); const took = end - start;
			const timeout = (Math.floor(took / 100) * 10000) + 120000;

			setTimeout(runGarbageCollector, timeout).unref();
		};

		runGarbageCollector();
	}
	else if (process.env.NODE_ENV === 'production') {
		logger.warning('Application was started without gc exposed, memory usage may be elevated');
	}
}

bootstrap();
