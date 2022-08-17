import { createStore } from 'src/omaha/helpers/stores';
import { Color } from 'src/omaha/helpers/theme';
import RepoActionRenderer from '../repositories/RepoActionRenderer.svelte';
import RepoCreateActionRenderer from '../repositories/RepoCreateActionRenderer.svelte';
import RepoRefreshActionRenderer from '../repositories/RepoRefreshActionRenderer.svelte';
import RepoSearchActionRenderer from '../repositories/RepoSearchActionRenderer.svelte';

export const repoActions = createStore<RepoActionsOptions>({
	href: '',
	actions: []
});

/**
 * Registers an action on the repository action bar. This is internal, don't use it.
 * @param href
 * @param action
 */
export function registerAction(href: string, action: RepoAction) {
	const existing = repoActions.get();

	if (existing.href !== href) {
		repoActions.set({
			href, actions: [action]
		});
	}
	else {
		let replaced = false;

		const actions = existing.actions.map(a => {
			if (action.name === 'custom') {
				if (a.name === 'custom' && a.key === action.key) {
					replaced = true;
					return action;
				}
			}
			else if (a.name === action.name) {
				replaced = true;
				return action;
			}

			return a;
		});

		if (!replaced) {
			actions.push(action);
		}

		repoActions.set({
			href: existing.href,
			actions
		});
	}
}

export function getActionFromName(name: RepoAction['name']) {
	switch (name) {
		case 'search': return RepoSearchActionRenderer;
		case 'refresh': return RepoRefreshActionRenderer;
		case 'create': return RepoCreateActionRenderer;
		case 'custom': return RepoActionRenderer;
	}
}

interface RepoActionsOptions {
	href: string;
	actions: RepoAction[];
}

export type RepoAction = RepoCustomAction | RepoSearchAction | RepoRefreshAction | RepoCreateAction;

export interface RepoCustomAction {
	name: 'custom';
	/**
	 * Provide a unique key for this action to prevent element duplication.
	 */
	key: string;
	click: () => void;
	href?: string;
	title?: string;
	text?: string;
	icon?: string;
	color?: Color;
}

export interface RepoSearchAction {
	name: 'search';
	submit: (value: string) => void;
	change: (value: string) => void;
	typestop: (value: string) => void;
	placeholder?: string;
	value: string;
	error: boolean;
}

export interface RepoRefreshAction {
	name: 'refresh';
	invoke: () => void;
	title?: string;
}

export interface RepoCreateAction {
	name: 'create';
	href: string;
	title?: string;
}
