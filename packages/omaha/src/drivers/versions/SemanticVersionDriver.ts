import { VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
import { BadRequestException } from '@nestjs/common';
import semver from 'semver';

export class SemanticVersionDriver implements VersionSchemeDriver {

	public validateVersionString(input: string): string {
		const version = semver.valid(input);

		if (version === null) {
			throw new BadRequestException(`The version '${input}' is not a valid semantic version`);
		}

		return version;
	}

	public getVersionsFromConstraint(versions: string[], constraint: string): string[] {
		console.log(versions);

		if (semver.valid(constraint) === null && semver.validRange(constraint) === null) {
			throw new BadRequestException(`The string '${constraint}' is not a valid semantic constraint`);
		}

		return versions.filter(version => {
			return semver.satisfies(version, constraint);
		});
	}

	public getVersionsSorted(versions: string[], direction: 'asc' | 'desc'): string[] {
		return versions.sort(direction === 'asc' ? semver.compare : semver.rcompare);
	}

}
