import { HttpException, Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { RealtimeService } from './realtime.service';
import getipaddr from 'proxy-addr';
import { Environment } from 'src/app.environment';

@WebSocketGateway({
	cors: { origin: '*' },
	namespace: 'events'
})
export class RealtimeGateway {

	private logger = new Logger('RealtimeGateway');

	public constructor(
		private readonly service: RealtimeService,
		private readonly tokens: TokensService,
	) {}

	/**
	 * Authenticates incoming connections and attaches listeners for their repositories.
	 */
	public async handleConnection(socket: Socket, ...args: any[]) {
		if (!socket || !socket.client || !socket.client.request) {
			this.logger.error('Rejected connection due to erroneous client');
			return false;
		}

		try {
			// Determine the remote address
			socket.remoteAddress = this.getRemoteAddress(socket);

			const auth = socket.client.request.headers.authorization;
			const token = await this.getToken(auth);

			if (!token) {
				socket.disconnect();
				return false;
			}

			return await this.service.register(socket, token);
		}
		catch (error) {
			if (error instanceof Error && !(error instanceof HttpException)) {
				this.logger.error(
					`Rejected connection from %s due to error: %s:`,
					socket.remoteAddress,
					error.name,
					error.message
				);
			}

			socket.disconnect();
			return false;
		}
	}

	/**
	 * Cleans up sockets and their connections after they disconnect.
	 */
	public async handleDisconnect(socket: Socket) {
		return this.service.deregister(socket);
	}

	/**
	 * Generates a token instance from the given authorization header value, or returns undefined.
	 *
	 * @param header
	 * @returns
	 */
	private async getToken(header?: string) {
		if (header && header.toLowerCase().startsWith('bearer ')) {
			const token = header.substring(7).trim();

			if (token.length > 0) {
				return this.tokens.getToken(token);
			}
		}

		return;
	}

	/**
	 * Determines the true remote address of the socket using the trusted proxy configuration.
	 *
	 * @param socket
	 * @returns
	 */
	private getRemoteAddress(socket: Socket) {
		const value = Environment.APP_TRUSTED_PROXY;

		switch (typeof value) {
			case 'undefined':
				return socket.conn.remoteAddress;
			case 'string':
				return getipaddr(socket.request, value.split(/, */g));
			case 'boolean':
				if (value) return getipaddr(socket.request, () => true);
				return socket.conn.remoteAddress;
			case 'number':
				if (value === 0) return socket.conn.remoteAddress;
				return getipaddr(socket.request, (addr, i) => i <= value - 1);
		}
	}

}

declare module 'socket.io' {
	export interface Socket {
		/**
		 * The remote address with trusted proxies applied.
		 */
		remoteAddress: string;
	}
}
