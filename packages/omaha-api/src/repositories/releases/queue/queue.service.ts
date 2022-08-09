import { forwardRef, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { ReleaseAttachmentStatus } from 'src/entities/enum/ReleaseAttachmentStatus';
import { ReleaseAttachment } from 'src/entities/ReleaseAttachment';
import { ReleaseJob } from 'src/entities/ReleaseJob';
import { ItemQueue } from '@baileyherbert/queue';
import { Release } from 'src/entities/Release';
import { Environment } from 'src/app.environment';
import { NestedSet } from '@baileyherbert/nested-collections';
import { QueueCleaner, QueueWorker } from './queue.decorator';
import { ReflectionClass, ReflectionMethod } from '@baileyherbert/reflection';
import { StorageService } from 'src/storage/storage.service';
import { exists } from 'src/support/utilities/exists';
import { RepositorySettingsManager } from 'src/repositories/settings/RepositorySettingsManager';
import { ReleasesService } from '../releases.service';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';
import { RealtimeService } from 'src/realtime/realtime.service';
import fs from 'fs';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {

	private shutdown = false;

	private jobs = new NestedSet<[releaseId: number, key: ReleaseJobKey], ReleaseJob>();
	private jobsPending = new Set<ReleaseJob>();
	private jobsActive = new Set<ReleaseJob>();

	private waiting = new NestedSet<[releaseId: number], WaitingRecord>();

	private queue: ItemQueue<ReleaseJob>;
	private workers = new Map<ReleaseJobKey, ReflectionMethod>();
	private cleaners = new Map<ReleaseJobKey, ReflectionMethod>();

	private logger = new Logger('QueueService');

	public constructor(
		@InjectRepository(ReleaseJob) private readonly repository: TypeOrmRepository<ReleaseJob>,
		@InjectRepository(ReleaseAttachment) private readonly attachments: TypeOrmRepository<ReleaseAttachment>,
		@InjectRepository(Release) private readonly releases: TypeOrmRepository<Release>,
		private readonly storage: StorageService,
		private readonly ws: RealtimeService,

		@Inject(forwardRef(() => ReleasesService))
		private readonly releaseService: ReleasesService,
	) {
		this.queue = new ItemQueue(item => this.onQueueItem(item), {
			maxConcurrentTasks: Environment.STORAGE_MAX_CONCURRENT_UPLOADS,
		});

		const ref = new ReflectionClass(this);
		const methods = ref.getMethods();

		for (const method of methods) {
			if (method.hasAttribute(QueueWorker)) {
				const worker = method.getAttribute(QueueWorker);
				this.workers.set(worker.job, method);
			}

			else if (method.hasAttribute(QueueCleaner)) {
				const cleaner = method.getAttribute(QueueCleaner);
				this.cleaners.set(cleaner.job, method);
			}
		}
	}

	/**
	 * Enqueues an attachment to be uploaded to the storage device.
	 *
	 * @param attachment The attachment entity to upload.
	 * @param path The path to the temporary file where the upload is stored.
	 */
	public async addAttachmentUpload(attachment: ReleaseAttachment, path: string) {
		return this.enqueue(await attachment.release, 'attachment_upload', {
			attachment_id: attachment.id,
			path
		});
	}

	/**
	 * Enqueues a release to be published.
	 *
	 * @param release The release to publish.
	 */
	public async addPublishRelease(release: Release) {
		return this.enqueue(release, 'publish');
	}

	/**
	 * Handles attachment uploads.
	 */
	@QueueWorker('attachment_upload')
	protected async onAttachmentUpload(release: Release, data: JobData<'attachment_upload'>) {
		const attachment = await this.attachments.findOne({
			where: { id: data.attachment_id },
			relations: {
				asset: true
			}
		});

		if (!attachment) {
			throw new UnresolvableQueueError('The attachment record has been deleted');
		}

		if (!await exists(data.path)) {
			throw new UnresolvableQueueError('The temporary upload file is missing');
		}

		const repo = await release.repository;
		const name = `${release.version}/${attachment.asset.name}`;

		this.logger.log(`Sending attachment <${attachment.id}> object "${name}" to storage for ${repo.id}`);

		const stream = fs.createReadStream(data.path, { encoding: 'binary' });
		await this.storage.write(this.storage.getObjectName(repo, name), attachment.size, stream);

		attachment.status = ReleaseAttachmentStatus.Ready;
		attachment.object_name = name;

		await this.attachments.save(attachment);
		await attachment.release;

		this.ws.emit(repo, 'attachment_updated', { attachment });

		return attachment;
	}

	/**
	 * Cleans up after attachment uploads.
	 */
	@QueueCleaner('attachment_upload')
	protected async afterAttachmentUpload(release: Release, data: JobData<'attachment_upload'>, error?: Error) {
		if (!error) {
			this.logger.log(`Finished sending attachment <${data.attachment_id}> object to storage`);
		}

		if (await exists(data.path)) {
			return fs.promises.unlink(data.path);
		}
	}

	/**
	 * Publishes a release, ensuring all of its attachments are ready first.
	 */
	@QueueWorker('publish')
	protected async onPublish(release: Release, data: JobData<'publish'>) {
		const checker = async () => {
			const attachments = await this.attachments.find({
				where: {
					release: {
						id: release.id
					}
				},
				select: {
					status: true
				}
			});

			for (const attachment of attachments) {
				if (attachment.status !== ReleaseAttachmentStatus.Ready) {
					return false;
				}
			}

			return true;
		};

		const repo = await release.repository;

		// Run checks & reconfigure as a waiter if not ready
		if (!await checker()) {
			this.logger.log(`Queued publish "${release.version}" from queue for ${repo.id}`);
			throw new WaitQueueError(checker);
		}

		const attachments = await this.attachments.find({
			where: {
				release: {
					id: release.id
				}
			}
		});

		if (attachments.length === 0) {
			throw new UnresolvableQueueError(
				`At least one attachment must be uploaded before this release can be published`
			);
		}

		let archivedReleaseVersions = new Array<string>();

		await this.releases.manager.transaction(async manager => {
			release.status = ReleaseStatus.Published;
			release.published_at = new Date();

			if (RepositorySettingsManager.get(repo.settings, 'releases.rolling')) {
				archivedReleaseVersions = await this.releaseService.internRollReleases(repo, release, manager);
			}

			await manager.save(release);
		});

		this.logger.log(`Published "${release.version}" from queue for ${repo.id}`);
		this.ws.emit(repo, 'release_published', { release });

		for (const version of archivedReleaseVersions) {
			const release = await this.releaseService.getFromVersion(repo, version);

			if (release) {
				this.ws.emit(repo, 'release_updated', { release })
			}
		}
	}

	/**
	 * Creates a new job instance, adds it to the local queue, and returns it.
	 *
	 * @param release
	 * @param name
	 * @param data
	 * @returns
	 */
	private async enqueue<K extends ReleaseJobKey, V extends JobArgs<K>>(release: Release, name: K, ...data: V): Promise<ReleaseJob> {
		const job = this.repository.create();
		job.name = name;
		job.data = data[0];
		job.release = Promise.resolve(release);

		await this.repository.save(job);

		this.jobs.add([release.id, name], job);
		this.jobsPending.add(job);

		if (!this.shutdown) {
			this.queue.push(job);
		}

		return job;
	}

	/**
	 * Runs queue jobs internally using workers and handles errors.
	 *
	 * @param job
	 * @returns
	 */
	private async onQueueItem(job: ReleaseJob) {
		const release = await job.release;

		// Mark as active
		this.jobsPending.delete(job);
		this.jobsActive.add(job);

		// Get worker and cleaner
		const worker = this.workers.get(job.name as ReleaseJobKey);
		const cleaner = this.cleaners.get(job.name as ReleaseJobKey);

		// Run the job
		try {
			if (!worker) {
				throw new Error('Worker not found: ' + job.name);
			}

			// Run worker
			await worker.invoke(this, release, job.data);
			this.jobsActive.delete(job);

			// Run cleaner
			if (cleaner) {
				try {
					await cleaner.invoke(this, release, job.data, undefined);
				}
				catch (error) {
					this.logger.error(`Error when running cleaner for job "${job.name}":`, error);
				}
			}

			// Delete the job
			await this.repository.delete(job.id);
			this.jobs.delete([release.id, job.name as ReleaseJobKey], job);

			// Check on waiters
			if (this.waiting.hasKey([release.id])) {
				for (const waiter of this.waiting.get([release.id])) {
					try {
						if (await waiter.fn()) {
							this.waiting.delete([release.id], waiter);
							this.queue.push(waiter.job);
						}
					}
					catch (error) {
						this.logger.error('Error in waiter callback:', error);
					}
				}
			}

			return;
		}
		catch (error) {
			this.jobsActive.delete(job);

			if (error instanceof WaitQueueError) {
				const record: WaitingRecord = {
					job,
					fn: error.fn
				};

				this.waiting.add([release.id], record);
				this.jobsPending.add(job);

				return;
			}

			this.logger.error(`Error when running worker for job "${job.name}":`, error);

			if (error instanceof UnresolvableQueueError) {
				// Run cleaner
				if (cleaner) {
					try {
						await cleaner.invoke(this, release, job.data, error);
					}
					catch (error) {
						this.logger.error(`Error when running cleaner for job "${job.name}":`, error);
					}
				}

				await this.repository.delete(job.id);
				return this.jobs.delete([release.id, job.name as ReleaseJobKey], job);
			}

			job.is_error = true;
			await this.repository.save(job);

			// Requeue the job in a minute
			setTimeout(() => {
				this.jobsPending.add(job);
				this.queue.push(job);
			}, 60000).unref();
		}
	}

	public async onModuleInit() {
		const jobs = await this.repository.find({
			select: {
				id: true,
				name: true,
				data: true,
				created_at: true,
				is_error: true,
				release: {
					id: true
				}
			},
			order: {
				id: 'asc'
			}
		});

		for (const job of jobs) {
			const release = await job.release;

			this.jobs.add([release.id, job.name as ReleaseJobKey], job);
			this.jobsPending.add(job);
			this.queue.push(job);
		}

		if (jobs.length > 0) {
			this.logger.log(`Resumed ${jobs.length} enqueued jobs from a previous run`);
		}
	}

	public async onModuleDestroy() {
		this.shutdown = true;
		// TODO: Gracefully cancel uploads
		return this.queue.stopAsync();
	}

}

interface ReleaseJobs {
	/**
	 * A job that uploads an attachment file to the storage destination.
	 */
	attachment_upload: {
		attachment_id: number;
		path: string;
	};

	/**
	 * A job that publishes a release.
	 */
	publish: undefined;
}

export type ReleaseJobKey = keyof ReleaseJobs;
type JobData<K extends keyof ReleaseJobs> = ReleaseJobs[K];
type JobArgs<K extends keyof ReleaseJobs> = ReleaseJobs[K] extends undefined ? [] : [data: ReleaseJobs[K]];

/**
 * Thrown when a worker determines a job is no longer possible to execute.
 */
class UnresolvableQueueError extends Error {}

/**
 * Thrown when a worker decides a job cannot be completed until one or more preconditions are met. A function must be
 * passed into the constructor that returns `true` when the task can be run. This function will be invoked and checked
 * each time another job completes under the same release.
 */
class WaitQueueError extends Error {
	public constructor(public readonly fn: () => Promise<any> | any) { super() }
}

interface WaitingRecord {
	job: ReleaseJob;
	fn: () => Promise<any> | any;
}
