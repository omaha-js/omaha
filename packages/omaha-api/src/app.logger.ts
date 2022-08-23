import { Logger, LogLevel } from '@baileyherbert/logging';
import { LoggerService } from '@nestjs/common';
import { Environment } from './app.environment';

export const logger = new Logger('Nest');

if (Environment.APP_LOGGING !== undefined) {
	logger.createConsoleTransport(LogLevel[Environment.APP_LOGGING]);
}
else {
	logger.createConsoleTransport(
		process.env.NODE_ENV === 'production' ?
		LogLevel.Information :
		LogLevel.Debug
	);
}

const DebugNames = new Set([
	'RouterExplorer',
	'RoutesResolver',
	'InstanceLoader'
]);

export class CustomLogger implements LoggerService {
	private loggers = new Map<string, Logger>();

	log(message: any, ...optionalParams: any[]) {
		if (typeof optionalParams[0] === 'string') {
			if (DebugNames.has(optionalParams[0])) {
				return this.debug(message, ...optionalParams);
			}
		}

		const target = this.alloc(optionalParams.pop());
		target.info(message, ...optionalParams);
	}

	error(message: any, ...optionalParams: any[]) {
		const target = this.alloc(optionalParams.pop());
		target.error(message, ...optionalParams);
	}

	warn(message: any, ...optionalParams: any[]) {
		const target = this.alloc(optionalParams.pop());
		target.warning(message, ...optionalParams);
	}

	debug(message: any, ...optionalParams: any[]) {
		const target = this.alloc(optionalParams.pop());
		target.debug(message, ...optionalParams);
	}

	verbose(message: any, ...optionalParams: any[]) {
		const target = this.alloc(optionalParams.pop());
		target.trace(message, ...optionalParams);
	}

	private alloc(name: string) {
		if (!this.loggers.has(name)) {
			this.loggers.set(name, logger.createChild(name));
		}

		return this.loggers.get(name)!;
	}
}
