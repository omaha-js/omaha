import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Token } from 'src/auth/tokens/models/Token';
import { Repository } from 'src/entities/Repository';
import { Repo } from 'src/support/Repo';
import { User } from 'src/support/User';
import { RepositoriesGuard } from '../repositories.guard';
import { CreateReleaseDto } from './dto/CreateReleaseDto';
import { SearchReleasesDto } from './dto/SearchReleasesDto';
import { UpdateReleaseDto } from './dto/UpdateReleaseDto';
import { ReleasesService } from './releases.service';

@Controller('repositories/:repo_id/releases')
@UseGuards(RepositoriesGuard)
export class ReleasesController {

	public constructor(
		private readonly service: ReleasesService
	) {}

	@Get()
	public async search(@Repo() repo: Repository, @Query() dto: SearchReleasesDto) {
		const list = (input: string) => (input
			.split(/(?: *, *)+/)
			.map(tag => tag.trim())
			.filter(tag => tag.length > 0)
		);

		return this.service.search(repo, {
			page: dto.page ? Number(dto.page) : 1,
			count: dto.count ? Number(dto.count) : 25,
			includeAttachments: ['1', 'true'].includes(dto.include_attachments ?? '0'),
			constraint: dto.constraint ?? undefined,
			tags: list(dto.tags ?? 'latest'),
			assets: list(dto.assets ?? ''),
			sort: dto.sort ?? 'version',
			sort_order: dto.sort_order ?? 'desc',
			status: dto.status ?? 'published'
		});
	}

	/**
	 * Creates a new draft release.
	 *
	 * @param repo
	 * @param dto
	 * @returns
	 */
	@Post()
	@UseScopes('repo.releases.create')
	public async create(@Repo() repo: Repository, @Body() dto: CreateReleaseDto) {
		return this.service.create(repo, dto);
	}

	/**
	 * Gets the specified release.
	 *
	 * @param repo
	 * @param version
	 * @param token
	 */
	@Get(':version')
	public async get(@Repo() repo: Repository, @Param('version') version: string, @User() token: Token) {
		const release = await this.service.getFromVersionOrFail(repo, version);

		// Require the "edit" privilege when reading a draft release
		if (release.draft && !token.hasPermission('repo.releases.edit')) {
			throw new NotFoundException(`No version matching '${version}' exists within the repository`);
		}

		// Lazy load tags and assets
		await Promise.all([
			release.tags,
			release.attachments
		]);

		return release;
	}

	/**
	 * Updates the specified release.
	 *
	 * @param repo
	 * @param version
	 * @param dto
	 * @returns
	 */
	@Patch(':version')
	@UseScopes('repo.releases.edit')
	public async update(@Repo() repo: Repository, @Param('version') version: string, @Body() dto: UpdateReleaseDto) {
		const release = await this.service.getFromVersionOrFail(repo, version);
		return this.service.update(repo, release, dto);
	}

	/**
	 * Deletes the specified release.
	 *
	 * @param repo
	 * @param version
	 * @returns
	 */
	@Delete(':version')
	@UseScopes('repo.releases.edit')
	public async delete(@Repo() repo: Repository, @Param('version') version: string) {
		const release = await this.service.getFromVersionOrFail(repo, version);
		await this.service.delete(release);

		return {
			success: true,
			message: 'Release has been deleted successfully.'
		};
	}

}
