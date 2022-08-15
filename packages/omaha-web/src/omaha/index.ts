import { ClientManager } from './managers/ClientManager';
import { AlertManager } from './managers/AlertManager';
import { RepositoriesManager } from './managers/RepositoriesManager';
import { SessionManager } from './managers/SessionManager';

export default {

	/**
	 * The manager for the API connection.
	 */
	client: new ClientManager(),

	/**
	 * The manager for the current session, account, and related data.
	 */
	session: new SessionManager(),

	/**
	 * The manager for repositories that the current account has access to.
	 */
	repositories: new RepositoriesManager(),

	/**
	 * The manager for pop-up alert dialogs.
	 */
	alerts: new AlertManager(),

};
