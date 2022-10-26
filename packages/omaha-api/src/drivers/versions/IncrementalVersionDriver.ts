import { BadRequestException } from '@nestjs/common';
import { VersionList, VersionSchemeDriver } from '../interfaces/VersionSchemeDriver';

/**
 * This driver accepts versions in any format. It considers each new release to be an incremental update over the
 * release before it. Thus, unlike other version schemes, it does not have a concept of major or minor versioning, and
 * it is not possible to create a release for an older version.
 */
export class IncrementalVersionDriver implements VersionSchemeDriver {

	public validateVersionString(input: string) {
		input = input.trim();

		if (input.length === 0) {
			throw new Error('Invalid version string');
		}

		return input;
	}

	public getVersionsFromConstraint(versions: VersionList, constraint: string) {
		const matches = constraint.match(/^(>=|>|<=|<|\^)?(.+)$/);

		if (!matches) {
			throw new BadRequestException(`The string '${constraint}' is not a valid version constraint`);
		}

		const targetOperator = matches[1];
		const targetVersion = matches[2];
		const targetIndex = versions.all.indexOf(targetVersion);
		let eligibleVersions: Set<string>;

		if (targetIndex < 0) {
			return [];
		}

		// Narrow down the eligible versions from the 'all' array bsaed on the target index
		switch (targetOperator) {
			case '^': case '>=': eligibleVersions = new Set(versions.all.slice(targetIndex)); break;
			case '>': eligibleVersions = new Set(versions.all.slice(targetIndex + 1)); break;
			case '<=': eligibleVersions = new Set(versions.all.slice(0, targetIndex + 1)); break;
			case '<': eligibleVersions = new Set(versions.all.slice(0, targetIndex)); break;
			case undefined: eligibleVersions = new Set(versions.all.slice(targetIndex, targetIndex + 1));
		}

		// Return versions within the 'selected' array that are eligible
		return versions.selected.filter(version => eligibleVersions.has(version));
	}

	public getVersionMatchesConstraint(versions: VersionList, input: string, constraint: string): boolean {
		const matches = this.getVersionsFromConstraint({
			all: versions.all, selected: [input]
		}, constraint);

		return matches.length > 0;
	}

	public getVersionsSorted(versions: VersionList, direction: 'asc' | 'desc') {
		const selected = [...versions.selected];

		// Sort the selection in ascending order (using the 'all' array)
		selected.sort((a, b) => versions.all.indexOf(a) - versions.all.indexOf(b));

		// Reverse the order for descending
		if (direction === 'desc') {
			selected.reverse();
		}

		return selected;
	}

	public getVersionsFromSameMajor(versions: VersionList, version: string): string[] {
		return versions.selected;
	}

}
