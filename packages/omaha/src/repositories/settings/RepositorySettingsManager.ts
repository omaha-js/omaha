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
