import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from 'src/entities/Asset';
import { Repository } from 'src/entities/Repository';
import { Repository as TypeOrmRepository } from 'typeorm';
import { CreateAssetDto } from './dto/CreateAssetDto';
import { UpdateAssetDto } from './dto/UpdateAssetDto';

@Injectable()
export class AssetsService {

	public constructor(
		@InjectRepository(Asset) private readonly repository: TypeOrmRepository<Asset>,
	) {}

	/**
	 * Creates a new asset for the given repository.
	 *
	 * @param repository
	 * @param dto
	 * @returns
	 */
	public async createAsset(repository: Repository, dto: CreateAssetDto) {
		const existing = await this.repository.count({
			where: {
				name: dto.name,
				repository: {
					id: repository.id
				}
			}
		});

		if (existing > 0) {
			throw new BadRequestException('An asset with that name already exists within this repository');
		}

		const asset = this.repository.create(dto);
		asset.repository = Promise.resolve(repository);

		return this.repository.save(asset);
	}

	/**
	 * Finds an asset by its name from within the given repository.
	 *
	 * @param repository
	 * @param assetName
	 * @returns
	 */
	public async getAsset(repository: Repository, assetName: string) {
		const asset = await this.repository.findOne({
			where: {
				name: assetName,
				repository: {
					id: repository.id
				}
			}
		});

		if (!asset) {
			throw new NotFoundException('No asset with that name exists in this repository');
		}

		return asset;
	}

	/**
	 * Updates the given asset from the data object.
	 *
	 * @param asset
	 * @param dto
	 * @returns
	 */
	public async updateAsset(asset: Asset, dto: UpdateAssetDto) {
		if (typeof dto.name === 'string') {
			asset.name = dto.name;
		}

		if (typeof dto.description === 'string') {
			asset.description = dto.description;
		}

		if (typeof dto.required === 'boolean') {
			asset.required = dto.required;
		}

		return this.repository.save(asset);
	}

	/**
	 * Deletes the given asset from the database.
	 *
	 * @param asset
	 * @returns
	 */
	public async deleteAsset(asset: Asset) {
		return this.repository.delete({
			id: asset.id
		});
	}

}
