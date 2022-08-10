import { MicrosoftVersionDriver } from 'src/drivers/versions/MicrosoftVersionDriver';

/**
 * This driver is for .NET applications which use four parts in their version numbers.
 * This is a quick, hacky solution to get it working with semver-like sorting and constraint filtering.
 *
 * <major> . <minor> . <patch> . <build>
 *
 * - The 'patch' is left-padded with zeroes until it reaches a length of 6.
 * - The 'build' is left-padded with zeroes until it reaches a length of 8.
 * - The two strings are concatenated in their natural order with a prefix of '1'
 */

describe('MicrosoftVersionDriver', function() {

	const driver = new MicrosoftVersionDriver();

	it('converts to semver', function() {
		expect(driver.toSemantic('0.0.0.0')).toBe('0.0.100000000000000');
		expect(driver.toSemantic('1.0.0.0')).toBe('1.0.100000000000000');
		expect(driver.toSemantic('1.2.3.4')).toBe('1.2.100000300000004');
		expect(driver.toSemantic('1.2.100003.10000004')).toBe('1.2.110000310000004');
	});

	it('converts from semver', function() {
		expect(driver.toMicrosoft('0.0.100000000000000')).toBe('0.0.0.0');
		expect(driver.toMicrosoft('1.0.100000000000000')).toBe('1.0.0.0');
		expect(driver.toMicrosoft('1.2.100000300000004')).toBe('1.2.3.4');
		expect(driver.toMicrosoft('1.2.110000310000004')).toBe('1.2.100003.10000004');
	});

	it('sorts properly', function() {
		const unsorted = ['1.0.0.2', '1.0.0.1', '1.1.0.0', '1.1.0.2', '1.0.1.1', '1.0.0.0', '1.0.1.2', '1.1.0.1', '1.0.1.0'];
		const sorted = ['1.0.0.0', '1.0.0.1', '1.0.0.2', '1.0.1.0', '1.0.1.1', '1.0.1.2', '1.1.0.0', '1.1.0.1', '1.1.0.2'];

		expect(driver.getVersionsSorted({ all: unsorted, selected: unsorted }, 'asc')).toEqual(sorted);
		expect(driver.getVersionsSorted({ all: unsorted, selected: unsorted }, 'desc')).toEqual(sorted.reverse());
	});

	it('sorts properly for large numbers', function() {
		const unsorted = [
			'1.0.0.0', '1.0.100.0', '1.0.50.0', '1.0.100.1', '1.0.200.0', '1.0.0.100', '1.0.100.200', '1.0.50.100',
			'1.0.100.50', '1.0.1.5', '1.1.5.5', '1.100.0.0', '1.100.100.0', '1.0.50.200'
		];

		const sorted = [
			'1.0.0.0', '1.0.0.100', '1.0.1.5', '1.0.50.0', '1.0.50.100', '1.0.50.200', '1.0.100.0', '1.0.100.1',
			'1.0.100.50', '1.0.100.200', '1.0.200.0', '1.1.5.5', '1.100.0.0', '1.100.100.0'
		];

		expect(driver.getVersionsSorted({ all: unsorted, selected: unsorted }, 'asc')).toEqual(sorted);
		expect(driver.getVersionsSorted({ all: unsorted, selected: unsorted }, 'desc')).toEqual(sorted.reverse());
	});

	it('implements greater/less than constraints', function() {
		const versions = ['1.0.0.0', '1.0.0.1', '1.0.1.0', '1.0.1.1', '1.1.0.0'];
		const list = { all: versions, selected: versions };

		expect(driver.getVersionsFromConstraint(list, '>1.0.0.0')).toEqual(versions.slice(1));
		expect(driver.getVersionsFromConstraint(list, '>=1.0.0.0')).toEqual(versions);

		expect(driver.getVersionsFromConstraint(list, '>1.0.1.0')).toEqual(versions.slice(3));
		expect(driver.getVersionsFromConstraint(list, '>=1.0.1.0')).toEqual(versions.slice(2));

		expect(driver.getVersionsFromConstraint(list, '<1.1.0.0')).toEqual(versions.slice(0, -1));
		expect(driver.getVersionsFromConstraint(list, '<=1.1.0.0')).toEqual(versions);

		expect(driver.getVersionsFromConstraint(list, '<1.0.1.0')).toEqual(versions.slice(0, 2));
		expect(driver.getVersionsFromConstraint(list, '<=1.0.1.0')).toEqual(versions.slice(0, 3));
	});

	it('implements caret constraints', function() {
		const versions = ['1.0.0.0', '1.0.0.1', '1.0.1.0', '1.1.0.0', '1.1.0.1', '2.0.0.0'];
		const list = { all: versions, selected: versions };

		expect(driver.getVersionsFromConstraint(list, '^1.0.0.0')).toEqual(versions.slice(0, -1));
		expect(driver.getVersionsFromConstraint(list, '^1.0.0.1')).toEqual(versions.slice(1, -1));
		expect(driver.getVersionsFromConstraint(list, '^1.1.0.0')).toEqual(versions.slice(3, -1));
		expect(driver.getVersionsFromConstraint(list, '^2.0.0.0')).toEqual(versions.slice(5));
	});

	it('implements tilde constraints', function() {
		const versions = ['1.0.0.0', '1.0.0.1', '1.0.1.0', '1.1.0.0', '1.1.0.1', '2.0.0.0'];
		const list = { all: versions, selected: versions };

		expect(driver.getVersionsFromConstraint(list, '~1.0.0.0')).toEqual(versions.slice(0, 3));
		expect(driver.getVersionsFromConstraint(list, '~1.0.0.1')).toEqual(versions.slice(1, 3));
		expect(driver.getVersionsFromConstraint(list, '~1.1.0.0')).toEqual(versions.slice(3, 5));
		expect(driver.getVersionsFromConstraint(list, '~2.0.0.0')).toEqual(versions.slice(5));
	});

	it('implements constraints with multiple parts', function() {
		const versions = ['1.0.0.0', '1.0.0.1', '1.0.1.0', '1.1.0.0', '1.1.0.1', '2.0.0.0'];
		const list = { all: versions, selected: versions };

		expect(driver.getVersionsFromConstraint(list, '>=1.0.0.0 <1.0.1.0')).toEqual(versions.slice(0, 2));
		expect(driver.getVersionsFromConstraint(list, '>=1.0.0.0 <2.0.0.0')).toEqual(versions.slice(0, -1));
		expect(driver.getVersionsFromConstraint(list, '>=1.0.0.0 <=2.0.0.0')).toEqual(versions);
	});

	it('implements specific version constraints', function() {
		const versions = ['1.0.0.0', '1.0.0.1', '1.0.1.0', '1.1.0.0', '1.1.0.1', '2.0.0.0'];
		const list = { all: versions, selected: versions };

		expect(driver.getVersionsFromConstraint(list, '1.0.0.0')).toEqual(versions.slice(0, 1));
		expect(driver.getVersionsFromConstraint(list, '1.0.1.0')).toEqual(versions.slice(2, 3));
	});

});
