import { NestedMap, NestedSet } from '@baileyherbert/nested-collections';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Socket } from 'socket.io';
import { RepositoryScopeId } from 'src/auth/auth.scopes';
import { BaseToken } from 'src/auth/tokens/models/BaseToken';
import { Collaboration } from 'src/entities/Collaboration';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';
import { Release } from 'src/entities/Release';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { Repository } from 'src/entities/Repository';
import { CollaborationsService } from 'src/repositories/collaborations/collaborations.service';
import { ReleasesService } from 'src/repositories/releases/releases.service';

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
	 * A nested set that links sockets to their subscriptions.
	 */
	private socketSubscriptions = new NestedSet<Socket, RealtimeSubscription>();

	/**
	 * A nested set that links repositories to all of their connections.
	 */
	private repositories = new NestedSet<string, RealtimeConnection>();

	/**
	 * A nested set that links repositories to all of their subscriptions.
	 */
	private repositorySubscriptions = new NestedSet<string, RealtimeSubscription>();

	public constructor(
		private readonly collaborations: CollaborationsService,

		@Inject(forwardRef(() => ReleasesService))
		private readonly releases: ReleasesService
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

			for (const subscription of this.socketSubscriptions.get(socket) ?? []) {
				this.socketSubscriptions.delete(socket, subscription);
				this.repositorySubscriptions.delete(subscription.repository.id, subscription);
			}

			this.logger.debug(
				'Closed websocket connection from %s',
				socket.remoteAddress
			);
		}
	}

	/**
	 * Registers a new subscription.
	 *
	 * @param socket
	 * @param subscriptionId
	 * @param repositoryId
	 * @param constraint
	 * @returns
	 */
	public async registerSubscription(socket: Socket, subscriptionId: number, repositoryId: string, constraint: string) {
		const connections = this.connections.get(socket);

		if (!this.sockets.has(socket) || !connections) {
			throw 'Socket not ready';
		}

		// Ensure there's a matching connection
		const connection = [...connections].find(conn => conn.repository.id === repositoryId);
		if (!connection) {
			throw 'Not connected to the target repository';
		}

		const repository = connection.repository;

		// Create the object
		const subscription = {
			id: subscriptionId,
			socket,
			repository,
			constraint,
		};

		// Get the current version
		const search = await this.releases.search(repository, connection.collaboration, {
			constraint,
			count: 1,
			assets: [],
			tags: [],
			includeAttachments: true,
			includeDownloads: false,
			page: 1,
			sort: 'version',
			sort_order: 'desc',
			statuses: [ReleaseStatus.Published]
		});

		// Register the subscription
		this.socketSubscriptions.add(socket, subscription);
		this.repositorySubscriptions.add(repositoryId, subscription);

		// Debugging
		this.logger.verbose(
			'Client %s created subscription %d on %s with constraint "%s"',
			socket.remoteAddress,
			subscriptionId,
			repositoryId,
			constraint
		);

		return instanceToPlain(search.results[0]) ?? true;
	}

	/**
	 * Updates the constraint of a subscription.
	 *
	 * @param socket
	 * @param subscriptionId
	 * @param constraint
	 * @returns
	 */
	public async updateSubscription(socket: Socket, subscriptionId: number, constraint: string) {
		const subscriptions = this.socketSubscriptions.get(socket);
		if (!subscriptions) return;

		const match = [...subscriptions].find(sub => sub.id === subscriptionId);
		if (!match) return;

		match.constraint = constraint;

		this.logger.verbose(
			'Client %s updated subscription %d on %s with constraint "%s"',
			socket.remoteAddress,
			subscriptionId,
			match.repository.id,
			constraint
		);
	}

	/**
	 * Closes a subscription.
	 *
	 * @param socket
	 * @param subscriptionId
	 * @returns
	 */
	public async closeSubscription(socket: Socket, subscriptionId: number) {
		const subscriptions = this.socketSubscriptions.get(socket);
		if (!subscriptions) return;

		const match = [...subscriptions].find(sub => sub.id === subscriptionId);
		if (!match) return;

		this.socketSubscriptions.delete(socket, match);
		this.repositorySubscriptions.delete(match.repository.id, match);

		this.logger.verbose(
			'Client %s closed subscription %d on %s',
			socket.remoteAddress,
			subscriptionId,
			match.repository.id
		);
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

	/**
	 * Sends a subscription notification to all clients subscribed to the repository for the given release (where
	 * their constraints match).
	 *
	 * @param repo
	 * @param release
	 * @returns
	 */
	public async emitNewRelease(repo: Repository, release: Release) {
		const subscriptions = this.repositorySubscriptions.get(repo.id);
		const driver = repo.driver;
		const list = await this.releases.getVersionList(repo, {
			assets: [],
			tags: [],
			sort_order: 'desc',
			statuses: [ReleaseStatus.Published],
		});

		if (!subscriptions) {
			return;
		}

		let count = 0;

		for (const subscription of subscriptions) {
			try {
				if (driver.getVersionMatchesConstraint(list, release.version, subscription.constraint)) {
					this.logger.verbose(
						'Invoked subscription %d for client %s with release "%s" on %s',
						subscription.id,
						subscription.socket.remoteAddress,
						release.version,
						subscription.repository.id,
					);

					count++;
					subscription.socket.emit('subscription:release', subscription.id, instanceToPlain(release, {
						excludePrefixes: ['_']
					}));
				}
			}
			catch (err) {
				this.logger.error('Uncaught error in subscription version emit:', err);
			}
		}

		this.logger.verbose(
			'Dispatched %d subscription notifications for release "%s" on %s',
			count,
			release.version,
			repo.id
		);
	}

}

interface RealtimeConnection {
	socket: Socket;
	collaboration: Collaboration;
	repository: Repository;
	token: BaseToken;
}

interface RealtimeSubscription {
	id: number;
	socket: Socket;
	repository: Repository;
	constraint: string;
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
