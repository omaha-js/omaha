import { Env } from '@baileyherbert/env';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Environment } from 'src/app.environment';
import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import twig from 'twig';

@Injectable()
export class EmailService implements OnModuleInit {

	private transport?: Transporter;
	private fromAddress?: string;
	private fromName?: string;

	private templatesDir = path.resolve(__dirname, '../../templates/emails');

	public onModuleInit() {
		if (Environment.SMTP_HOST) {
			const env = Env.rules({
				SMTP_HOST: Env.schema.string(),
				SMTP_PORT: Env.schema.number(),
				SMTP_USERNAME: Env.schema.string(),
				SMTP_PASSWORD: Env.schema.string(),
				SMTP_FROM_ADDRESS: Env.schema.string(),
				SMTP_FROM_NAME: Env.schema.string(),
				SMTP_SECURE: Env.schema.boolean().optional(false),
				SMTP_REQUIRE_TLS: Env.schema.boolean().optional(false)
			});

			this.transport = nodemailer.createTransport({
				host: env.SMTP_HOST,
				port: env.SMTP_PORT,
				secure: env.SMTP_SECURE,
				requireTLS: env.SMTP_REQUIRE_TLS,
				auth: {
					user: env.SMTP_USERNAME,
					pass: env.SMTP_PASSWORD
				}
			});

			this.fromAddress = env.SMTP_FROM_ADDRESS;
			this.fromName = env.SMTP_FROM_NAME;
		}
	}

	/**
	 * This will be `true` when email is configured and enabled on the system.
	 */
	public get enabled() {
		return !!this.transport;
	}

	/**
	 * Sends an email with the given options.
	 *
	 * @param options
	 */
	public async send(options: SendMailOptions) {
		if (!options.template.endsWith('.twig')) {
			options.template += '.twig';
		}

		if (!this.transport) {
			throw new BadRequestException('Email is not enabled on this server');
		}

		const addresses = Array.isArray(options.to) ? options.to : [options.to];
		const text = await this.render(options);
		const promises = addresses.map(to => this.transport!.sendMail({
			to,
			from: {
				name: this.fromName!,
				address: this.fromAddress!
			},
			subject: options.subject,
			text
		}));

		await Promise.all(promises);
	}

	/**
	 * Renders the template from the given options.
	 *
	 * @param options
	 * @returns
	 */
	private render(options: SendMailOptions) {
		return new Promise<string>((resolve, reject) => {
			const context = {
				...(options.context ?? {}),
				env: Environment
			};

			twig.renderFile(path.resolve(this.templatesDir, options.template), context, (err, html) => {
				if (err) reject(err);
				else resolve(html);
			});
		});
	}

}

export interface SendMailOptions {
	to: string | string[];
	subject: string;
	template: string;
	context?: any;
}
