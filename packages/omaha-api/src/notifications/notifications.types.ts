import { Account } from 'src/entities/Account';
import { Collaboration } from 'src/entities/Collaboration';
import { CollaborationInvite } from 'src/entities/CollaborationInvite';
import { CollaborationRole } from 'src/entities/enum/CollaborationRole';
import { RepositoryAccessType } from 'src/entities/enum/RepositoryAccessType';
import { Release } from 'src/entities/Release';
import { Token } from 'src/entities/Token';

export type RepoNotificationEvents = {

	/**
	 * Emitted when a new release is published.
	 */
	repo_release_published: {
		release: Release;
		remoteAddress: string;
	};

	/**
	 * Emitted when a collaboration invite is sent by someone in the repository.
	 */
	repo_collab_invite: {
		invite: CollaborationInvite;
	};

	/**
	 * Emitted when a collaboration invite is accepted and the recipient has joined the repository.
	 */
	repo_collab_accepted: {
		collaboration: Collaboration;
		collaborationAccount: Account;
	};

	/**
	 * Emitted when a collaborator is removed from the repository.
	 */
	repo_collab_removed: {
		collaboration: Collaboration;
		collaborationAccount: Account;
		wasKicked: boolean;
	};

	/**
	 * Emitted when a token is created for the repository.
	 */
	repo_token_created: {
		token: Token;
	};

	/**
	 * Emitted when a token is deleted from the repository.
	 */
	repo_token_deleted: {
		token: Token;
	};

	/**
	 * Emitted when a repository's visibility is changed.
	 */
	repo_visibility_updated: {
		previous: RepositoryAccessType;
		next: RepositoryAccessType;
	};

};

export type AccountNotificationEvents = {

	/**
	 * Emitted when a token is created for an account.
	 */
	account_token_created: {
		token: Token;
	};

	/**
	 * Emitted when a token is deleted from an account.
	 */
	account_token_deleted: {
		token: Token;
	};

}

export type NotificationEvents = RepoNotificationEvents & AccountNotificationEvents;
export type RepoNotificationId = keyof RepoNotificationEvents;
export type AccountNotificationId = keyof AccountNotificationEvents;
export type NotificationId = keyof NotificationEvents;

export const RepoNotificationList = [
	{
		id: 'repo_release_published',
		description: 'When a new release has been published',
		roles: [CollaborationRole.Owner, CollaborationRole.Manager]
	},
	{
		id: 'repo_collab_invite',
		description: 'When an invite is sent by someone in the repository',
		roles: [CollaborationRole.Owner]
	},
	{
		id: 'repo_collab_accepted',
		description: 'When an invite is accepted and the recipient joins the repository',
		roles: [CollaborationRole.Owner]
	},
	{
		id: 'repo_collab_removed',
		description: 'When a collaborator is removed from the repository',
		roles: [CollaborationRole.Owner]
	},
	{
		id: 'repo_token_created',
		description: 'When a token is created for the repository',
		roles: [CollaborationRole.Owner, CollaborationRole.Manager]
	},
	{
		id: 'repo_token_deleted',
		description: 'When a token is deleted from the repository',
		roles: [CollaborationRole.Owner, CollaborationRole.Manager]
	},
	{
		id: 'repo_visibility_updated',
		description: `When a repository's visibility is changed`,
		roles: [CollaborationRole.Owner, CollaborationRole.Manager]
	},
] as const;

export const AccountNotificationList = [
	{
		id: 'account_token_created',
		description: `When a token is created for your account`
	},
	{
		id: 'account_token_deleted',
		description: `When a token is deleted from your account`
	},
] as const;

export const NotificationList = [
	...RepoNotificationList,
	...AccountNotificationList,
] as const;
