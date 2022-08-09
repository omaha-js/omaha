import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UseScopes } from 'src/auth/decorators/scopes.decorator';
import { Repository } from 'src/entities/Repository';
import { Repo } from 'src/support/Repo';
import { RepositoriesGuard } from '../repositories.guard';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/CreateAssetDto';
import { UpdateAssetDto } from './dto/UpdateAssetDto';

@Controller('repositories/:repo_id/assets')
@UseGuards(RepositoriesGuard)
export class AssetsController {

	public constructor(
		private readonly service: AssetsService
	) {}

	@Get()
	public async getAssetList(@Repo() repo: Repository) {
		return await repo.assets;
	}

	@Post()
	@UseScopes('repo.assets.manage')
	public async createAsset(@Repo() repo: Repository, @Body() dto: CreateAssetDto) {
		return this.service.createAsset(repo, dto);
	}

	@Get(':asset_name')
	public async getAsset(@Repo() repo: Repository, @Param('asset_name') assetName: string) {
		return this.service.getAsset(repo, assetName);
	}

	@Patch(':asset_name')
	@UseScopes('repo.assets.manage')
	public async updateAsset(@Repo() repo: Repository, @Param('asset_name') assetName: string, @Body() dto: UpdateAssetDto) {
		const asset = await this.service.getAsset(repo, assetName);
		return this.service.updateAsset(asset, dto);
	}

	@Delete(':asset_name')
	@UseScopes('repo.assets.manage')
	public async deleteAsset(@Repo() repo: Repository, @Param('asset_name') assetName: string) {
		const asset = await this.service.getAsset(repo, assetName);
		await this.service.deleteAsset(asset);

		return {
			success: true,
			message: 'Asset has been deleted successfully.'
		};
	}

}
