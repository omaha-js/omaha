import { RepositorySettingParameters, RepositorySettingParameterType, RepositorySettings, RepositorySettingsKeys, RepositorySettingsObject } from './RepositorySettings';

export class RepositorySettingsManager {

	/**
	 * Transforms the given object into a proper settings object with default values added.
	 *
	 * @param input
	 */
	public static transform(input: object): RepositorySettingsObject {
		const output: any = {};

		for (const name in RepositorySettings) {
			const params: RepositorySettingParameters = RepositorySettings[name];
			output[name] = input[name] ?? params.default;
		}

		return output;
	}

	/**
	 * Sanitizes the given object into a new settings object, only preserving keys that match registered settings.
	 *
	 * @param input
	 */
	public static sanitize(input: object): RepositorySettingsObject {
		const output: any = {};

		for (const name in RepositorySettings) {
			if (name in input) {
				output[name] = input[name];
			}
		}

		return output;
	}

	/**
	 * Validates the given object and ensures it contains the correct value types for its settings.
	 *
	 * @param input
	 */
	public static validate(input: object) {
		for (const name in RepositorySettings) {
			const params: RepositorySettingParameters = RepositorySettings[name];

			if (name in input) {
				if (typeof input[name] !== params.type) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Gets the value of the specified setting from the given object, returning its default value if not configured.
	 *
	 * @param input
	 * @param key
	 */
	public static get<K extends RepositorySettingsKeys>(input: object, key: K): RepositorySettingParameterType<Settings[K]> {
		if (key in input) {
			return (input as any)[key];
		}

		return RepositorySettings[key].default as any;
	}

}

type Settings = typeof RepositorySettings;
