import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Repository } from 'src/entities/Repository';
import { Repo } from 'src/support/Repo';
import { RepositoriesGuard } from '../repositories.guard';
import { CreateTagDto } from './dto/CreateTagDto';
import { UpdateTagDto } from './dto/UpdateTagDto';
import { TagsService } from './tags.service';

@Controller('repositories/:repo_id/tags')
@UseGuards(RepositoriesGuard)
export class TagsController {

	public constructor(
		private readonly service: TagsService
	) {}

	@Get()
	public async getTagList(@Repo() repo: Repository) {
		return await repo.tags;
	}

	@Post()
	@UseScopes('repo.tags.manage')
	public createTag(@Repo() repo: Repository, @Body() dto: CreateTagDto) {
		return this.service.createTag(repo, dto);
	}

	@Get(':tag_name')
	public async getTag(@Repo() repo: Repository, @Param('tag_name') tagName: string) {
		return this.service.getTag(repo, tagName);
	}

	@Patch(':tag_name')
	@UseScopes('repo.tags.manage')
	public async updateTag(@Repo() repo: Repository, @Param('tag_name') tagName: string, @Body() dto: UpdateTagDto) {
		const tag = await this.service.getTag(repo, tagName);
		return this.service.updateTag(tag, dto);
	}

	@Delete(':tag_name')
	@UseScopes('repo.tags.manage')
	public async deleteTag(@Repo() repo: Repository, @Param('tag_name') tagName: string) {
		const tag = await this.service.getTag(repo, tagName);
		await this.service.deleteTag(tag);

		return {
			success: true,
			message: 'Tag has been deleted successfully.'
		};
	}

}
