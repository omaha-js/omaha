import { NestedSet } from '@baileyherbert/nested-collections';
import { Injectable, Logger } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Socket } from 'socket.io';
import { RepositoryScopeId } from 'src/auth/auth.scopes';
import { BaseToken } from 'src/auth/tokens/models/BaseToken';
import { Collaboration } from 'src/entities/Collaboration';
import { Release } from 'src/entities/Release';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { Repository } from 'src/entities/Repository';
import { CollaborationsService } from 'src/repositories/collaborations/collaborations.service';

@Injectable()
export class RealtimeService {

	private logger = new Logger('RealtimeService');

	/**
	 * A set of all connected sockets.
	 */
	private sockets = new Set<Socket>();

	/**
	 * A nested set that links sockets to their connections.
	 */
	private connections = new NestedSet<Socket, RealtimeConnection>();

	/**
	 * A nested set that links repositories to all of their connections.
	 */
	private repositories = new NestedSet<string, RealtimeConnection>();

	public constructor(
		private readonly collaborations: CollaborationsService
	) {}

	/**
	 * Registers a new authenticated socket connection.
	 *
	 * @param socket
	 * @param token
	 */
	public async register(socket: Socket, token: BaseToken) {
		const collaborations = await this.collaborations.getForToken(token);
		const connections = new Array<RealtimeConnection>();

		for (const collab of collaborations) {
			const repo = await collab.repository;

			if (!repo) {
				continue;
			}

			const connection: RealtimeConnection = {
				socket,
				collaboration: collab,
				repository: repo,
				token
			};

			this.sockets.add(socket);
			this.connections.add(socket, connection);
			this.repositories.add(repo.id, connection);

			connections.push(connection);
		}

		// Send list of connected repositories
		socket.emit('repositories', connections.map(conn => instanceToPlain({
			repository: conn.repository,
			scopes: conn.collaboration.getFullScopes()
		})));

		this.logger.debug(
			'Accepted websocket connection from %s for %d repositories',
			socket.remoteAddress,
			connections.length
		);
	}

	/**
	 * Deregisters a socket connection and cleans up its connections.
	 *
	 * @param socket
	 */
	public async deregister(socket: Socket) {
		if (this.sockets.has(socket)) {
			for (const connection of this.connections.get(socket) ?? []) {
				this.repositories.delete(connection.repository.id, connection);
				this.connections.delete(socket, connection);
			}

			this.logger.debug(
				'Closed websocket connection from %s',
				socket.remoteAddress
			);
		}
	}

	/**
	 * Emits an event to all connected clients.
	 *
	 * @param repo
	 *   The repository entity, or the string identifier of the repository, for which this event will be emitted.
	 * @param name
	 *   The name of the event to emit.
	 * @param value
	 *   The value of the event.
	 * @param scopes
	 *   An optional array of scopes. When provided, listeners must have at least one of the specified
	 *   scopes in order to receive the event.
	 */
	public emit<K extends keyof Events>(repo: Repository | string, name: K, value: Events[K], scopes?: RepositoryScopeId[]) {
		const id = typeof repo === 'string' ? repo : repo.id;
		const connections = this.repositories.get(id);

		for (const connection of connections ?? []) {
			if (Array.isArray(scopes) && scopes.length > 0) {
				const matches = scopes.filter(scope => connection.collaboration.hasPermission(scope));

				if (matches.length === 0) {
					continue;
				}
			}

			connection.socket.emit(name, id, instanceToPlain(value, {
				groups: ['ws'],
				excludePrefixes: ['_']
			}));
		}
	}

}

interface RealtimeConnection {
	socket: Socket;
	collaboration: Collaboration;
	repository: Repository;
	token: BaseToken;
}

interface Events {
	release_created: { release: Release };
	release_updated: { release: Release };
	release_published: { release: Release };
	release_deleted: { release: Release };
	attachment_created: { attachment: ReleaseAttachment };
	attachment_updated: { attachment: ReleaseAttachment };
	attachment_deleted: { attachment: ReleaseAttachment };
}
