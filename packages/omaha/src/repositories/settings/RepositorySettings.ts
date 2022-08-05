/**
 * An object containing all possible settings for repositories. Each setting object contains its type, default value,
 * and potentially other metadata.
 */
export const RepositorySettings = {
	/**
	 * Whether new releases should automatically archive prior releases under the same major version.
	 */
	'releases.rolling': {
		type: 'boolean',
		default: false
	},

	/**
	 * The number of days after which an archived release's files will be deleted from storage.
	 */
	'releases.retention.days': {
		type: 'number',
		default: 14
	},

	/**
	 * The number of the latest archived releases per major version whose files will be preserved, regardless of the
	 * number of days that have elapsed.
	 */
	'releases.retention.number': {
		type: 'number',
		default: 10
	},
} as const;

export type RepositorySettingsKeys = keyof typeof RepositorySettings;
export type RepositorySettingsObject = {
	-readonly [K in keyof typeof RepositorySettings]: RepositorySettingParameterType<typeof RepositorySettings[K]>;
}

type TypeString = 'number' | 'boolean' | 'string';
type ExtractType<T extends TypeString> = T extends 'number' ? number :
	T extends 'string' ? string :
	T extends 'boolean' ? boolean :
	never;

/**
 * Used to extract the value type of a given `RepositorySettingParameters` type.
 */
export type RepositorySettingParameterType<T> = T extends RepositorySettingParameters ? WithOptional<T, ExtractType<T['type']>> : never;
type WithOptional<T, V> = T extends { default: any } ? V : V | undefined;

export type RepositorySettingParameters =
	RepositorySettingNumberParameter |
	RepositorySettingBooleanParameter |
	RepositorySettingStringParameter;

type RepositorySettingNumberParameter = {
	type: 'number';
	default?: number;
};

type RepositorySettingBooleanParameter = {
	type: 'boolean';
	default?: boolean;
};

type RepositorySettingStringParameter = {
	type: 'string';
	default?: string;
};
