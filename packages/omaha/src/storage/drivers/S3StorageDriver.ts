import { Repository } from 'src/entities/Repository';
import { ReadStream } from 'typeorm/platform/PlatformTools';
import { StorageDriver } from '../../storage/drivers/StorageDriver';

export class S3StorageDriver implements StorageDriver {

	public init(): Promise<void> {
		throw new Error('Method not implemented.');
	}

	public write(repo: Repository, name: string, stream: ReadStream): Promise<string> {
		throw new Error('Method not implemented.');
	}

	public exists(repo: Repository, name: string): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

	public delete(repo: Repository, name: string): Promise<void> {
		throw new Error('Method not implemented.');
	}

	public getDownloadLink(repo: Repository, name: string, duration: number, disposition?: string): Promise<string> {
		throw new Error('Method not implemented.');
	}

}
