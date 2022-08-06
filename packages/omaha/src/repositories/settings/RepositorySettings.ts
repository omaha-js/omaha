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
	 * The number of latest releases to allow per major version. The minimum value is 1, at which only the latest
	 * published version will be preserved, and all others will be archived automatically.
	 */
	'releases.rolling.buffer': {
		type: 'number',
		default: 10,
		validator: (value: any) => typeof value === 'number' && value > 0
	},

	/**
	 * The number of days after which an archived release's files will be expire and be deleted from storage.
	 */
	'releases.archives.expiration': {
		type: 'number',
		default: 14
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
	validator?: (value: any) => boolean;
};

type RepositorySettingBooleanParameter = {
	type: 'boolean';
	default?: boolean;
	validator?: (value: any) => boolean;
};

type RepositorySettingStringParameter = {
	type: 'string';
	default?: string;
	validator?: (value: any) => boolean;
};
