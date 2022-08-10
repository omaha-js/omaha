import { RepositoryVersionScheme } from 'src/entities/enum/RepositoryVersionScheme';
import { VersionSchemeDriver } from './interfaces/VersionSchemeDriver';
import { IncrementalVersionDriver } from './versions/IncrementalVersionDriver';
import { MicrosoftVersionDriver } from './versions/MicrosoftVersionDriver';
import { SemanticVersionDriver } from './versions/SemanticVersionDriver';

export const VersionSchemeDrivers: Record<RepositoryVersionScheme, VersionSchemeDriver> = {
	semantic: new SemanticVersionDriver(),
	incremental: new IncrementalVersionDriver(),
	microsoft: new MicrosoftVersionDriver(),
};
