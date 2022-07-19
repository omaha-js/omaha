import { RepoVersionScheme } from 'src/repositories/repositories.types';
import { VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
import { SemanticVersionDriver } from './SemanticVersionDriver';

export const VersionSchemeDrivers: Record<RepoVersionScheme, VersionSchemeDriver> = {
	semantic: new SemanticVersionDriver(),
	calendar: null,
	incremental: null,
	microsoft: null,
	rolling: null,
};
