import { VersionParseResult, VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
import semver from 'semver';
import { BadRequestException } from '@nestjs/common';

export class SemanticVersionDriver implements VersionSchemeDriver {

	public parseVersionString(input: string): VersionParseResult {
		if (!semver.valid(input)) {
			throw new BadRequestException(`The version string '${input}' is not valid semver`);
		}

		const result = semver.parse(input);

		return {
			versionPart1: result.major,
			versionPart2: result.minor,
			versionPart3: result.patch,
			versionPart4: null,
			versionMeta: result.prerelease.length > 0 ? result.prerelease.join('.') : null,
			versionBuildMeta: result.build.length > 0 ? result.build.join('.') : null
		};
	}

	public getVersionString(parsed: VersionParseResult): string {
		throw new Error('Method not implemented.');
	}

}
