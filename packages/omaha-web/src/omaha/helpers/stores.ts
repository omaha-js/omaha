import { writable } from 'svelte/store';

export function createStore<T>(initial: T): Store<T> {
	let localValue = initial;
	const { set, subscribe } = writable(localValue);

	return {
		subscribe,
		set: (value: T) => {
			localValue = value;
			set(localValue);
		},
		update: (updater: (value: T) => T) => {
			localValue = updater(localValue);
			set(localValue);
		},
		get: () => {
			return localValue;
		}
	};
}

type Subscriber<T> = (value: T) => void;
type Unsubscriber = () => void;
type Invalidator<T> = (value?: T) => void;

export type Store<T> = {
	subscribe: (run: Subscriber<T>, invalidate?: Invalidator<T>) => Unsubscriber;
	set: (value: T) => void;
	update: (updater: (value: T) => T) => void;
	get: () => T;
};
