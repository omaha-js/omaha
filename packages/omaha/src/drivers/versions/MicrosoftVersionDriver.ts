import { VersionList, VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
import { BadRequestException } from '@nestjs/common';
import semver from 'semver';

/**
 * This driver uses the official `semver` package to implement Microsoft .NET versioning, which uses the
 * `major.minor.build.revision` format. Internally, the `revision` number is converted to semantic prerelease metadata
 * for easy filtering and sorting.
 */
export class MicrosoftVersionDriver implements VersionSchemeDriver {

	/**
	 * Converts a semantic version (`1.0.0-0`) into the corresponding microsoft version (`1.0.0.0`).
	 *
	 * @param input
	 * @returns
	 */
	private getMicrosoftFromSemantic(input: string) {
		const version = semver.parse(input.trim());

		if (version === null) {
			throw new BadRequestException(
				`The version '${input}' is not a valid semantic version - this should never happen!`
			);
		}

		return `${version.major}.${version.minor}.${version.patch}.${version.prerelease}`;
	}

	/**
	 * Converts a microsoft version (`1.0.0.0`) into the corresponding semantic version (`1.0.0-0`).
	 *
	 * @param input
	 * @returns
	 */
	private getSemanticFromMicrosoft(input: string) {
		const match = input.trim().match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);

		if (!match) {
			throw new BadRequestException(
				`The version '${input}' is not a valid microsoft version`
			);
		}

		const version = `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}-${Number(match[4])}`;

		if (semver.valid(version) === null) {
			throw new BadRequestException(
				`The translated version '${version}' was invalid - this should never happen!`
			);
		}

		return version;
	}

	public validateVersionString(input: string): string {
		return this.getMicrosoftFromSemantic(this.getSemanticFromMicrosoft(input));
	}

	public getVersionsFromConstraint(versions: VersionList, constraint: string): string[] {
		constraint = this.getSemanticFromMicrosoft(constraint);

		if (semver.valid(constraint) === null && semver.validRange(constraint) === null) {
			throw new BadRequestException(`The string '${constraint}' is not a valid semantic constraint`);
		}

		return versions.selected.filter(version => {
			return semver.satisfies(this.getSemanticFromMicrosoft(version), constraint);
		});
	}

	public getVersionsSorted(versions: VersionList, direction: 'asc' | 'desc'): string[] {
		// TODO: Refactor! This isn't the best way to do this!
		const sorted = versions.selected
			.map(version => this.getSemanticFromMicrosoft(version))
			.sort(direction === 'asc' ? semver.compare : semver.rcompare)
			.map(version => this.getMicrosoftFromSemantic(version));

		return versions.selected.sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b));
	}

	public getVersionsFromSameMajor(versions: VersionList, version: string): string[] {
		const major = semver.major(version);
		return versions.selected.filter(version => semver.major(version) === major);
	}

}
