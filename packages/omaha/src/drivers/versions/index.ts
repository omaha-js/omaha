import { RepositoryVersionScheme } from 'src/entities/enum/RepositoryVersionScheme';
import { VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
import { MicrosoftVersionDriver } from './MicrosoftVersionDriver';
import { SemanticVersionDriver } from './SemanticVersionDriver';

export const VersionSchemeDrivers: Record<RepositoryVersionScheme, VersionSchemeDriver> = {
	semantic: new SemanticVersionDriver(),
	calendar: null,
	incremental: null,
	microsoft: new MicrosoftVersionDriver(),
};
