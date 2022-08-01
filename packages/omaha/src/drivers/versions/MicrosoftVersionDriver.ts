import { VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
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

		const version = `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;

		if (semver.valid(version) === null) {
			throw new BadRequestException(
				`The translated version '${version}' was invalid - this should never happen!`
			);
		}

		return version;
	}

	public validateVersionString(input: string): string {
		this.getSemanticFromMicrosoft(input);
		return input.trim();
	}

	public getVersionsFromConstraint(versions: string[], constraint: string): string[] {
		if (constraint === '*') {
			return versions;
		}

		constraint = this.getSemanticFromMicrosoft(constraint);

		if (semver.valid(constraint) === null && semver.validRange(constraint) === null) {
			throw new BadRequestException(`The string '${constraint}' is not a valid semantic constraint`);
		}

		return versions.filter(version => {
			return semver.satisfies(this.getSemanticFromMicrosoft(version), constraint);
		});
	}

	public getVersionsSorted(versions: string[], direction: 'asc' | 'desc'): string[] {
		// TODO: Refactor! This isn't the best way to do this!
		const sorted = versions
			.map(version => this.getSemanticFromMicrosoft(version))
			.sort(direction === 'asc' ? semver.compare : semver.rcompare)
			.map(version => this.getMicrosoftFromSemantic(version));

		return versions.sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b));
	}

}
