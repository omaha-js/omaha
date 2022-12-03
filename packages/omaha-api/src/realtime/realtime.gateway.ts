import { HttpException, Logger, UnauthorizedException } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { RealtimeService } from './realtime.service';
import getipaddr from 'proxy-addr';
import { Environment } from 'src/app.environment';
import { RatelimitManager } from 'src/ratelimit/ratelimit.manager';
import { RatelimitService } from 'src/ratelimit/ratelimit.service';
import { Release } from 'src/entities/Release';

@WebSocketGateway({
	cors: { origin: '*' },
	namespace: 'events'
})
export class RealtimeGateway {

	private logger = new Logger('RealtimeGateway');
	private connectionManager: RatelimitManager;
	private missManager: RatelimitManager;

	public constructor(
		private readonly service: RealtimeService,
		private readonly tokens: TokensService,
		private readonly ratelimit: RatelimitService,
	) {
		this.connectionManager = this.ratelimit.getManager('ws_connect', 25, 50, 150);
		this.missManager = this.ratelimit.getManager('ws_connect_miss', 5, 10, 20);
	}

	/**
	 * Authenticates incoming connections and attaches listeners for their repositories.
	 */
	public async handleConnection(socket: Socket, ...args: any[]) {
		if (!socket || !socket.client || !socket.client.request) {
			this.logger.error('Rejected connection due to erroneous client');
			socket && socket.disconnect(true);
			return false;
		}

		try {
			// Determine the remote address
			socket.remoteAddress = this.getRemoteAddress(socket);

			// Miss guard
			if (this.missManager.check(socket.remoteAddress) === 0) {
				socket.emit('close_reason', `You've sent an incorrect token too many times! Try again later.`, 429);
				socket.disconnect(true);
				return false;
			}

			// Rate limiting
			if (this.connectionManager.guard(socket.remoteAddress) === false) {
				socket.emit('close_reason', `You're sending requests too quickly`, 429);
				socket.disconnect(true);
				return false;
			}

			try {
				const auth = socket.client.request.headers.authorization;
				const token = await this.getToken(auth);

				return await this.service.register(socket, token);
			}
			catch (error) {
				if (error instanceof HttpException) {
					this.missManager.guard(socket.remoteAddress);
					socket.emit('close_reason', error.message, 403);
				}
				else {
					socket.emit('close_reason', 'Internal error', 500);
				}
			}

			socket.disconnect(true);
			return false;
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

			socket.emit('close_reason', 'Internal error', 500);
			socket.disconnect(true);
			return false;
		}
	}

	/**
	 * Cleans up sockets and their connections after they disconnect.
	 */
	public async handleDisconnect(socket: Socket) {
		return this.service.deregister(socket);
	}

	@SubscribeMessage('subscribe')
	protected async handleNewSubscription(socket: Socket, data: unknown) {
		if (!Array.isArray(data)) return false;
		if (data.length !== 3) return false;

		const remoteId: number = data[0];
		const repoId: string = data[1];
		const constraint: string = data[2];

		if (typeof remoteId !== 'number') return false;
		if (typeof repoId !== 'string') return false;
		if (typeof constraint !== 'string') return false;

		try {
			return await this.service.registerSubscription(socket, remoteId, repoId, constraint);
		}
		catch (err) {
			this.logger.error('Failed to create subscription for client <%s>:', socket.remoteAddress, err);
			return false;
		}
	}

	@SubscribeMessage('subscription:update')
	protected handleUpdateSubscription(socket: Socket, data: unknown) {
		if (!Array.isArray(data)) return false;
		if (data.length !== 2) return false;

		const remoteId: number = data[0];
		const constraint: string = data[1];

		if (typeof remoteId !== 'number') return false;
		if (typeof constraint !== 'string') return false;

		this.service.updateSubscription(socket, remoteId, constraint);
		return true;
	}

	@SubscribeMessage('subscription:close')
	protected handleCloseSubscription(socket: Socket, remoteId: number) {
		if (typeof remoteId !== 'number') return false;

		this.service.closeSubscription(socket, remoteId);
		return true;
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
				const match = await this.tokens.getToken(token);

				if (match) {
					return match;
				}
			}
		}

		throw new UnauthorizedException('Invalid token');
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
