import { VersionList, VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';
import { BadRequestException } from '@nestjs/common';
import semver from 'semver';

/**
 * This driver uses the official `semver` package to implement Microsoft .NET versioning, which uses the
 * `major.minor.build.revision` format. This driver is currently very hacky for development speed, and should be
 * reimplemented later.
 */
export class MicrosoftVersionDriver implements VersionSchemeDriver {

	/**
	 * Converts a semantic version (`1.0.0-0`) into the corresponding microsoft version (`1.0.0.0`).
	 *
	 * @param input
	 * @returns
	 */
	public toMicrosoft(input: string) {
		const version = semver.parse(input.trim());

		if (version === null) {
			throw new BadRequestException(
				`The version '${input}' is not a valid semantic version - this should never happen!`
			);
		}

		const computedPatch = version.patch.toString();

		if (computedPatch.length !== 15) {
			throw new Error(`Patch segment must be 15 bytes (got ${computedPatch.length})`);
		}

		const patch = Number(computedPatch.slice(1, 7));
		const build = Number(computedPatch.slice(7, 15));

		return `${version.major}.${version.minor}.${patch}.${build}`;
	}

	/**
	 * Converts a microsoft version (`1.0.0.0`) into the corresponding semantic version (`1.0.0-0`).
	 *
	 * @param input
	 * @returns
	 */
	public toSemantic(input: string) {
		const match = input.trim().match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);

		if (!match) {
			throw new BadRequestException(
				`The version '${input}' is not a valid microsoft version`
			);
		}

		const major = Number(match[1]);
		const minor = Number(match[2]);
		const patch = Number(match[3]);
		const build = Number(match[4]);

		if (patch > 999999) throw new BadRequestException('Patch number must not exceed 6 digits');
		if (build > 99999999) throw new BadRequestException('Build number must not exceed 8 digits');

		const computedPatch = '1' + patch.toString().padStart(6, '0') + build.toString().padStart(8, '0');
		const version = `${major}.${minor}.${computedPatch}`;

		if (semver.valid(version) === null) {
			throw new BadRequestException(
				`The translated version '${version}' was invalid - this should never happen!`
			);
		}

		return version;
	}

	public toSemanticConstraint(input: string) {
		return input.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/g, match => this.toSemantic(match));
	}

	public validateVersionString(input: string): string {
		return this.toMicrosoft(this.toSemantic(input));
	}

	public getVersionsFromConstraint(versions: VersionList, constraint: string): string[] {
		constraint = this.toSemanticConstraint(constraint);

		if (semver.valid(constraint) === null && semver.validRange(constraint) === null) {
			throw new BadRequestException(`The string '${constraint}' is not a valid semantic constraint`);
		}

		return versions.selected.filter(version => {
			return semver.satisfies(this.toSemantic(version), constraint);
		});
	}

	public getVersionsSorted(versions: VersionList, direction: 'asc' | 'desc'): string[] {
		const sorted = versions.selected
			.map(version => this.toSemantic(version))
			.sort(direction === 'asc' ? semver.compare : semver.rcompare)
			.map(version => this.toMicrosoft(version));

		return versions.selected.sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b));
	}

	public getVersionsFromSameMajor(versions: VersionList, version: string): string[] {
		const major = semver.major(this.toSemantic(version));
		return versions.selected
			.map(version => this.toSemantic(version))
			.filter(version => semver.major(version) === major)
			.map(version => this.toMicrosoft(version));
	}

}
