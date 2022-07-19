import 'reflect-metadata';
import App from './App.svelte';
import { SessionManager } from './omaha/core/SessionManager';

SessionManager.init();

const app = new App({
	target: document.body
});

export default app;
