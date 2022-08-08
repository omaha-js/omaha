import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TokensService } from 'src/auth/tokens/tokens.service';
import { RealtimeService } from './realtime.service';

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

		const auth = socket.client.request.headers.authorization;
		const token = await this.getToken(auth);

		if (!token) {
			socket.disconnect();
			return false;
		}

		return this.service.register(socket, token);
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

}

