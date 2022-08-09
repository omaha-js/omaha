<script lang="ts">
	import { router, Route } from 'tinro';
	import Loader from './components/helpers/Loader.svelte';
	import Loadable from './components/helpers/routing/Loadable.svelte';
	import ProtectedRoute from './components/helpers/routing/ProtectedRoute.svelte';
	import AdminLayout from './components/layouts/AdminLayout.svelte';
	import NotificationTray from './components/layouts/notifications/NotificationTray.svelte';
	import { account, sessionLoading } from './omaha/core/SessionManager';

	// router.base('/admin');
	// router.mode.hash();
	router.subscribe(() => window.scrollTo(0, 0));
</script>

{#if $sessionLoading}
	<Loader full size={40} theme="gray" message="Loading" />
{:else if $account}
	<AdminLayout>
		<Route path="/">Admin</Route>

		<!-- Account -->
		<Route path="/account/repositories"><Loadable component={ () => import('./pages/protected/account/repositories/index.svelte') } /></Route>
		<Route path="/account/tokens"><Loadable component={ () => import('./pages/protected/account/tokens/index.svelte') } /></Route>
		<Route path="/account/settings" redirect="/account/settings/profile" />
		<Route path="/account/settings/*"><Loadable component={ () => import('./pages/protected/account/settings.svelte') } /></Route>
	</AdminLayout>
{:else}
	<Route path="/login"><Loadable component={ () => import('./pages/login.svelte') } /></Route>
	<Route path="/register"><Loadable component={ () => import('./pages/register.svelte') } /></Route>
	<ProtectedRoute path="/*" fallback></ProtectedRoute>
{/if}

<NotificationTray />
