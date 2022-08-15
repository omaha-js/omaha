<script lang="ts">
	import omaha from 'src/omaha';
	import { bootstrapped } from 'src/omaha/bootstrap';

	import { router, Route } from 'tinro';
	import Loader from './components/helpers/Loader.svelte';
	import Loadable from './components/helpers/routing/Loadable.svelte';
	import ProtectedRoute from './components/helpers/routing/ProtectedRoute.svelte';
	import Layout from './components/layouts/Layout.svelte';
	import NotificationTray from './components/layouts/notifications/NotificationTray.svelte';

	const { account } = omaha.session;

	router.subscribe(() => window.scrollTo(0, 0));
</script>

{#if !$bootstrapped}
	<Loader full size={40} theme="gray" message="Loading" />
{:else if $account}
	<Layout>
		<Route path="/">Admin</Route>

		<!-- Repositories -->
		<Route path="/repository/:repo_id/*">
			<Route path="/" redirect="releases" />
			<Route path="/releases">repo releases</Route>
			<Route path="/assets">repo assets</Route>
			<Route path="/tags">repo tags</Route>
			<Route path="/stats">repo stats</Route>
			<Route path="/settings/*">repo settings</Route>
		</Route>

		<!-- Account -->
		<Route path="/account/repositories"><Loadable component={ () => import('./pages/protected/account/repositories/index.svelte') } /></Route>
		<Route path="/account/tokens"><Loadable component={ () => import('./pages/protected/account/tokens/index.svelte') } /></Route>
		<Route path="/account/settings" redirect="/account/settings/profile" />
		<Route path="/account/settings/*"><Loadable component={ () => import('./pages/protected/account/settings.svelte') } /></Route>
	</Layout>
{:else}
	<Route path="/login"><Loadable component={ () => import('./pages/guard/login.svelte') } /></Route>
	<Route path="/register"><Loadable component={ () => import('./pages/guard/register.svelte') } /></Route>
	<ProtectedRoute path="/*" fallback></ProtectedRoute>
{/if}

<NotificationTray />
