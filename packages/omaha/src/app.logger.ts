import { Logger } from '@baileyherbert/logging';
import { LoggerService } from '@nestjs/common';

export const logger = new Logger('Nest');
logger.createConsoleTransport();

export class CustomLogger implements LoggerService {
	private loggers = new Map<string, Logger>();

	log(message: any, ...optionalParams: any[]) {
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
