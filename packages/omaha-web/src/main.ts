import 'reflect-metadata';
import App from './app/App.svelte';
import { bootstrap } from './omaha/bootstrap';

bootstrap();

const app = new App({
	target: document.body
});

document.body.querySelector('.preloading').remove();

export default app;
