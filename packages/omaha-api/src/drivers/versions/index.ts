import { RepositoryVersionScheme } from 'src/entities/enum/RepositoryVersionScheme';
import { VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
import { IncrementalVersionDriver } from './IncrementalVersionDriver';
import { MicrosoftVersionDriver } from './MicrosoftVersionDriver';
import { SemanticVersionDriver } from './SemanticVersionDriver';

export const VersionSchemeDrivers: Record<RepositoryVersionScheme, VersionSchemeDriver> = {
	semantic: new SemanticVersionDriver(),
	incremental: new IncrementalVersionDriver(),
	microsoft: new MicrosoftVersionDriver(),
};
