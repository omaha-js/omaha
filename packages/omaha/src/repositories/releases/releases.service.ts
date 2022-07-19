import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Release } from 'src/entities/Release';
import { Repository } from 'src/entities/Repository';
import { CreateReleaseDto } from './dto/CreateReleaseDto';
import { Repository as TypeOrmRepository } from 'typeorm';
import { TagsService } from '../tags/tags.service';
import { UpdateReleaseDto } from './dto/UpdateReleaseDto';

@Injectable()
export class ReleasesService {

	public constructor(
		@InjectRepository(Release) private readonly repository: TypeOrmRepository<Release>,
		private readonly tags: TagsService,
	) {}

	/**
	 * Gets a release from its version string. Returns `null` if not found.
	 *
	 * @param repo
	 * @param version
	 */
	public async getFromVersion(repo: Repository, version: string) {
		return this.repository.findOne({
			where: {
				repository: { id: repo.id },
				version
			}
		});
	}

	/**
	 * Gets a release from its version string. Throws an exception if not found.
	 *
	 * @param repo
	 * @param version
	 */
	public async getFromVersionOrFail(repo: Repository, version: string) {
		const release = await this.getFromVersion(repo, version);

		if (!release) {
			throw new NotFoundException(`No version matching '${version}' exists within the repository`);
		}

		return release;
	}

	/**
	 * Searches for assets.
	 */
	public async search() {

	}

	/**
	 * Creates a new draft release.
	 *
	 * @param dto
	 */
	public async create(repo: Repository, dto: CreateReleaseDto) {
		// Check for a matching version name in the repository
		if (await this.getFromVersion(repo, dto.version)) {
			throw new BadRequestException('The specified version already exists within the repository');
		}

		// Parse the version string with the driver
		const version = repo.driver.parseVersionString(dto.version);

		// Create the release
		const release = this.repository.create({
			version: dto.version,
			versionPart1: version.versionPart1,
			versionPart2: version.versionPart2,
			versionPart3: version.versionPart3,
			versionPart4: version.versionPart4,
			versionMeta: version.versionMeta,
			versionBuildMeta: version.versionBuildMeta,
			draft: true,
			description: dto.description,
		});

		// Attach the repository
		release.repository = Promise.resolve(repo);

		// Resolve the tags
		// This will throw errors if the tag(s) don't exist, so we'll await it
		const tags = await Promise.all(
			dto.tags.map(tag => this.tags.getTag(repo, tag))
		);

		// Attach the tags
		release.tags = Promise.resolve(tags);

		// Save and return
		return this.repository.save(release);
	}

	/**
	 * Updates an existing release. This can also be used to publish it.
	 */
	public async update(repo: Repository, release: Release, dto: UpdateReleaseDto) {
		release.description = dto.description;

		// Check if the update is eligible for publishing when setting draft=false
		if (release.draft && dto.draft === false) {
			// Get the assets for both the repository and the release
			const repoAssets = await repo.assets;
			const releaseAssets = await release.assets;

			// Check if all required assets have an upload
			for (const repoAsset of repoAssets) {
				if (repoAsset.required) {
					const asset = releaseAssets.find(asset => asset.asset.id === repoAsset.id);

					if (!asset) {
						throw new BadRequestException(`The ${repoAsset.name} asset is required before publishing`);
					}
				}
			}

			release.draft = false;
			release.published_at = new Date();
		}

		// Throw an error when attempting to unpublish
		else if (!release.draft && dto.draft) {
			throw new BadRequestException('Cannot change the draft status of a published release');
		}

		// Resolve the tags
		// This will throw errors if the tag(s) don't exist, so we'll await it
		const tags = await Promise.all(
			dto.tags.map(tag => this.tags.getTag(repo, tag))
		);

		// Attach the tags
		release.tags = Promise.resolve(tags);

		// Save and return
		return this.repository.save(release);
	}

	/**
	 * Deletes a release. This can only be done while it is in a draft state.
	 */
	public async delete(release: Release) {
		if (!release.draft) {
			throw new BadRequestException('Cannot delete a release after it has been published');
		}

		return this.repository.delete({
			id: release.id
		});
	}

}
