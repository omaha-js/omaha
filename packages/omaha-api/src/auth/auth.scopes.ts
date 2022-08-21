/**
 * An array of scopes that grant access to accounts.
 */
export const AccountScopes = [
	{
		id: 'account.settings.read',
		name: 'View settings',
		description: `View the account's name and email`
	},
	{
		id: 'account.settings.manage',
		name: 'Manage settings',
		description: `Change the account's name, email, and password`
	},
	{
		id: 'account.tokens.list',
		name: 'List tokens',
		description: 'View a list of access tokens for the account'
	},
	{
		id: 'account.tokens.manage',
		name: 'Manage tokens',
		description: 'Create, edit, and delete access tokens for the account'
	},
	{
		id: 'account.repos.manage',
		name: 'Manage repositories',
		description: `Create and delete repositories`
	},
	{
		id: 'account.notifications.manage',
		name: 'Manage notifications',
		description: 'View and change notification settings for the account'
	}
] as const;

/**
 * An array of scopes that grant access to repositories.
 */
export const RepositoryScopes = [
	{
		id: 'repo.manage',
		name: 'Manage repositories',
		description: `Edit repositories that they have access to`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.tokens.list',
		name: 'List tokens',
		description: `View a list of access tokens`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.tokens.manage',
		name: 'Manage tokens',
		description: `Create, edit, and delete access tokens`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.collaborations.list',
		name: 'List collaborators',
		description: `View a list of all collaborators`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.collaborations.manage',
		name: 'Manage collaborators',
		description: `Manage and add new collaborators`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.releases.create',
		name: 'Create releases',
		description: `Create and publish new releases, and edit drafts`,
		groups: ['owner', 'manager', 'publisher']
	},
	{
		id: 'repo.releases.edit',
		name: 'Edit releases',
		description: `Edit the details of published releases`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.releases.attachments.manage',
		name: 'Manage release attachments',
		description: `Manage attached files for draft releases`,
		groups: ['owner', 'manager', 'publisher']
	},
	{
		id: 'repo.releases.attachments.download',
		name: 'Download releases',
		description: `Download files attached to releases`,
		groups: ['owner', 'manager', 'auditor']
	},
	{
		id: 'repo.tags.manage',
		name: 'Manage tags',
		description: `Create, edit, and delete tags`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.assets.manage',
		name: 'Manage assets',
		description: `Create, edit, and delete assets`,
		groups: ['owner', 'manager']
	},
	{
		id: 'repo.audit.downloads',
		name: 'View download logs',
		description: `View the download logs for the entire repository`,
		groups: ['owner', 'manager']
	},
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
