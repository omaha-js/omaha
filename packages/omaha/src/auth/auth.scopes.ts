
/**
 * An array of scopes that grant access to accounts.
 */
export const AccountScopes = [
	{
		id: 'account.settings.read',
		name: 'View settings',
		description: `Allows clients to view an account's name and email`
	},
	{
		id: 'account.settings.manage',
		name: 'Manage settings',
		description: `Allows clients to change the account's name, email, and password`
	},
	{
		id: 'account.tokens.list',
		name: 'List tokens',
		description: 'Allows clients to view a list of tokens generated for the account'
	},
	{
		id: 'account.tokens.manage',
		name: 'Manage tokens',
		description: 'Allows clients to create, edit, and delete tokens generated for the account'
	},
	{
		id: 'account.repos.manage',
		name: 'Manage repositories',
		description: `Allows clients to create and delete repositories`
	},
] as const;

/**
 * An array of scopes that grant access to repositories.
 */
export const RepositoryScopes = [
	{
		id: 'repo.manage',
		name: 'Manage repositories',
		description: `Allows clients to edit repositories that they have access to`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.tokens.list',
		name: 'List tokens',
		description: `Allows clients to view a list of tokens generated for the repository`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.tokens.manage',
		name: 'Manage tokens',
		description: `Allows clients to create, edit, and delete tokens generated for the repository`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.collaborations.list',
		name: 'List collaborators',
		description: `Allows clients to view a list of all collaborators in the repository`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.collaborations.manage',
		name: 'Manage collaborators',
		description: `Allows clients to add new or manage existing collaborators in the repository`,
		groups: ['owner']
	},
	{
		id: 'repo.releases.create',
		name: 'Create releases',
		description: `Allows clients to create new releases and edit draft releases`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.releases.edit',
		name: 'Edit releases',
		description: `Allows clients to edit published releases`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.releases.attachments.manage',
		name: 'Manage release attachments',
		description: `Allows clients to manage attached files for draft releases`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.releases.attachments.download',
		name: 'Download releases',
		description: `Allows clients to download files attached to releases`,
		groups: ['owner', 'manager', 'auditor']
	},
	{
		id: 'repo.tags.manage',
		name: 'Manage tags',
		description: `Allows clients to create, edit, and delete release tags for the repository`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.assets.manage',
		name: 'Manage assets',
		description: `Allows clients to create, edit, and delete release assets for the repository`,
		groups: ['owner', 'manager']
	}
] as const;

/**
 * An array of all allowed scopes in the application.
 */
export const AuthScopes = [
	...AccountScopes.map(scope => ({ ...scope, type: 'account' as const })),
	...RepositoryScopes.map(scope => ({ ...scope, type: 'repo' as const })),
] as const;

/**
 * A tuple containing all possible scope IDs for the application.
 */
export type AuthScopeId = ExtractId<typeof AuthScopes>;

/**
 * A tuple containing all possible account-related scope IDs for the application.
 */
export type AccountScopeId = ExtractId<typeof AccountScopes>;

/**
 * A tuple containing all possible repository-related scope IDs for the application.
 */
export type RepositoryScopeId = ExtractId<typeof RepositoryScopes>;

/**
 * An array of all scope IDs as strings.
 */
export const AllScopeIds = AuthScopes.map(scope => scope.id);

/**
 * Helper type for extracting the scope IDs.
 */
type ExtractId<T> = T extends ReadonlyArray<{ id: infer U }> ? U: never;
