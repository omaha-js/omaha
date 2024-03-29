import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Collaboration } from 'src/entities/Collaboration';
import { ReleaseStatus } from 'src/entities/enum/ReleaseStatus';
import { Repository } from 'src/entities/Repository';
import { Collab } from 'src/support/Collab';
import { Repo } from 'src/support/Repo';
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
	public async search(@Repo() repo: Repository, @Query() dto: SearchReleasesDto, @Collab() collab?: Collaboration) {
		const list = (input: string) => (input
			.split(/(?: *, *)+/)
			.map(tag => tag.trim().toLowerCase())
			.filter(tag => tag.length > 0)
		);

		return this.service.search(repo, collab, {
			page: Number(dto.page),
			count: Number(dto.count),
			includeAttachments: ['1', 'true'].includes(dto.include_attachments),
			includeDownloads: ['1', 'true'].includes(dto.include_downloads),
			constraint: dto.constraint ?? undefined,
			tags: list(dto.tags),
			assets: list(dto.assets),
			sort: dto.sort,
			sort_order: dto.sort_order,
			statuses: [...new Set(list(dto.status).map(value => {
				switch (value.trim().toLowerCase()) {
					case 'draft': return ReleaseStatus.Draft;
					case 'published': return ReleaseStatus.Published;
					case 'archived': return ReleaseStatus.Archived;
					default: throw new BadRequestException(`Unknown status type "${value}"`);
				}
			}))]
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
	public async create(@Repo() repo: Repository, @Body() dto: CreateReleaseDto, @Req() request: Request) {
		return this.service.create(repo, dto, request.ip);
	}

	/**
	 * Gets the specified release.
	 *
	 * @param repo
	 * @param version
	 * @param collab
	 */
	@Get(':version')
	public async get(@Repo() repo: Repository, @Param('version') version: string, @Collab() collab?: Collaboration) {
		const release = await this.service.getFromVersionOrFail(repo, version);

		if (release.status === ReleaseStatus.Draft && collab) {
			// Require relevant privileges when reading a draft release
			if (!collab.hasPermission('repo.releases.create') && !collab.hasPermission('repo.releases.attachments.manage')) {
				throw new NotFoundException(`No version matching '${version}' exists within the repository`);
			}
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
	public async update(
		@Repo() repo: Repository,
		@Param('version') version: string,
		@Body() dto: UpdateReleaseDto,
		@Req() request: Request,
		@Collab() collab?: Collaboration,
	) {
		if (!collab) {
			throw new ForbiddenException('You do not have privileges to access this endpoint');
		}

		const release = await this.service.getFromVersionOrFail(repo, version);

		// Require the 'create' privilege when editing drafts
		if (release.status === ReleaseStatus.Draft) {
			collab.requirePermission('repo.releases.create');
		}

		// Require the 'edit' privilege when editing published and archived releases
		else {
			collab.requirePermission('repo.releases.edit');
		}

		return this.service.update(repo, release, dto, request.ip);
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
