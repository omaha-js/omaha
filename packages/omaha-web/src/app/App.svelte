<script lang="ts">
	import omaha from 'src/omaha';
	import { bootstrapped } from 'src/omaha/bootstrap';
	import { router, Route } from 'tinro';
	import Loader from './components/helpers/Loader.svelte';
	import Loadable from './components/helpers/routing/Loadable.svelte';
	import LoadableForRepo from './components/helpers/routing/LoadableForRepo.svelte';
	import ProtectedRoute from './components/helpers/routing/ProtectedRoute.svelte';
	import Layout from './components/layouts/Layout.svelte';
	import NotificationTray from './components/layouts/notifications/NotificationTray.svelte';
	import { Repository } from '@omaha/client';

	const { account } = omaha.session;

	const regex = /\/repository\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
	const { repositories } = omaha.repositories;

	let repository: Repository | undefined;

	$: {
		const match = $router.path.match(regex);

		if (match) {
			const activeId = match[1].toLowerCase();
			const active = $repositories.find(repo => repo.id === activeId);

			if (repository !== active) {
				repository = active;
			}
		}
		else if (repository !== undefined) {
			repository = undefined;
		}
	}

	router.subscribe(() => window.scrollTo(0, 0));
</script>

{#if !$bootstrapped}
	<Loader full size={40} theme="gray" message="Loading" />
{:else if $account}
	<Layout {repository}>
		<Route path="/">Admin</Route>

		<!-- Repositories -->
		<Route path="/repositories/create"><Loadable component={ () => import('./pages/repositories/create.svelte') } /></Route>
		<Route path="/repository/:repo_id/*">
			{#if repository}
			<Route path="/" redirect="releases" />
			<Route path="/releases"><LoadableForRepo repo={repository} component={ () => import('./pages/repositories/releases.svelte') } /></Route>
			<Route path="/assets"><LoadableForRepo repo={repository} component={ () => import('./pages/repositories/assets.svelte') } /></Route>
			<Route path="/tags"><LoadableForRepo repo={repository} component={ () => import('./pages/repositories/tags.svelte') } /></Route>
			<Route path="/stats"><LoadableForRepo repo={repository} component={ () => import('./pages/repositories/stats.svelte') } /></Route>
			<Route path="/settings/*"><LoadableForRepo repo={repository} component={ () => import('./pages/repositories/settings.svelte') } /></Route>
			{/if}
		</Route>

		<!-- Account -->
		<Route path="/account/repositories"><Loadable component={ () => import('./pages/protected/account/repositories/index.svelte') } /></Route>
		<Route path="/account/tokens"><Loadable component={ () => import('./pages/protected/account/tokens/index.svelte') } /></Route>
		<Route path="/account/settings" redirect="/account/settings/profile" />
		<Route path="/account/settings/*"><Loadable component={ () => import('./pages/protected/account/settings.svelte') } /></Route>
	</Layout>
{:else}
	<Route>
		<Route path="/login"><Loadable component={ () => import('./pages/guard/login.svelte') } /></Route>
		<Route path="/register"><Loadable component={ () => import('./pages/guard/register.svelte') } /></Route>
		<ProtectedRoute fallback />
	</Route>
{/if}

<NotificationTray />
