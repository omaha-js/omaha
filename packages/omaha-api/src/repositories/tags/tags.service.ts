import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from 'src/entities/Tag';
import { Repository } from 'src/entities/Repository';
import { Repository as TypeOrmRepository } from 'typeorm';
import { CreateTagDto } from './dto/CreateTagDto';
import { UpdateTagDto } from './dto/UpdateTagDto';

@Injectable()
export class TagsService {

	public constructor(
		@InjectRepository(Tag) private readonly repository: TypeOrmRepository<Tag>,
	) {}

	/**
	 * Creates a new tag for the given repository.
	 *
	 * @param repository
	 * @param dto
	 * @returns
	 */
	public async createTag(repository: Repository, dto: CreateTagDto) {
		const existing = await this.repository.count({
			where: {
				name: dto.name,
				repository: {
					id: repository.id
				}
			}
		});

		if (existing > 0) {
			throw new BadRequestException('A tag with that name already exists within this repository');
		}

		const tag = this.repository.create(dto);
		tag.repository = Promise.resolve(repository);

		return this.repository.save(tag);
	}

	/**
	 * Finds a tag by its name from within the given repository.
	 *
	 * @param repository
	 * @param tagName
	 * @returns
	 */
	public async getTag(repository: Repository, tagName: string) {
		const tag = await this.repository.findOne({
			where: {
				name: tagName,
				repository: {
					id: repository.id
				}
			}
		});

		if (!tag) {
			throw new NotFoundException(`No tag with the name '${tagName}' exists in this repository`);
		}

		return tag;
	}

	/**
	 * Updates the given tag from the data object.
	 *
	 * @param tag
	 * @param dto
	 * @returns
	 */
	public async updateTag(tag: Tag, dto: UpdateTagDto) {
		if (typeof dto.description === 'string') {
			tag.description = dto.description;
		}

		return this.repository.save(tag);
	}

	/**
	 * Deletes the given tag from the database.
	 *
	 * @param tag
	 * @returns
	 */
	public async deleteTag(tag: Tag) {
		if (tag.name === 'latest') {
			throw new BadRequestException(`This is a built-in tag that cannot be deleted`);
		}

		return this.repository.delete({
			id: tag.id
		});
	}

	/**
	 * Returns the names of all tags available in the given repository.
	 *
	 * @param repo
	 * @returns
	 */
	public async getAllTags(repo: Repository): Promise<string[]> {
		const builder = this.repository.createQueryBuilder();

		builder.select(['Tag.name as name']);
		builder.where('Tag.repository_id = :id', repo);

		const rows = await builder.getRawMany();
		const tags = rows.map(row => row.name);

		return tags;
	}

}
