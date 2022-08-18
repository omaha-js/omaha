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
	import { Collaboration, Repository } from '@omaha/client';
	import PromiseLoader from './components/helpers/PromiseLoader.svelte';
	import { setContext } from 'svelte';

	const { account } = omaha.session;

	const regex = /\/repository\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
	const { repositories } = omaha.repositories;

	let collab: Collaboration | undefined;
	let repository: Repository | undefined;
	let repositoryPromise: Promise<Repository> | undefined;
	let repositoryPromiseId = '';

	const [client] = omaha.client.useFromComponent();

	$: {
		const match = $router.path.match(regex);

		if (match) {
			const activeId = match[1].toLowerCase();
			const active = $repositories.find(repo => repo.id === activeId);

			if (repository !== active) {
				repository = active;
				collab = active?.collaboration;
			}

			if (active && repositoryPromiseId !== active.id) {
				repositoryPromiseId = active.id;
				client.abort();
				repositoryPromise = client.repos.get(repositoryPromiseId);
			}
		}
		else if (repository !== undefined) {
			repository = undefined;
		}
	}

	setContext('app', {
		async refreshRepository() {
			if (repositoryPromiseId) {
				try {
					const repo = await client.repos.get(repositoryPromiseId);
					repositoryPromise = Promise.resolve(repo);
				}
				catch (err) {}
			}
		}
	})

	router.subscribe(() => window.scrollTo(0, 0));
</script>

{#if !$bootstrapped}
	<Loader full size={40} theme="gray" message="Loading" />
{:else if $account}
	<Layout {repository}>
		<Route path="/">Admin</Route>

		<!-- Repository management (account side) -->
		<Route path="/repositories/create"><Loadable component={ () => import('./pages/repositories/create.svelte') } /></Route>

		<!-- Repositories -->
		{#if repository && collab && repositoryPromise}
			<PromiseLoader promise={repositoryPromise} let:value={repo}>
				<Route path="/repository/:repo_id/*" firstmatch>
					<Route path="/" redirect="releases" />
					<Route path="/releases"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/releases.svelte') } /></Route>
					<Route path="/releases/create"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/releases/create.svelte') } /></Route>
					<Route path="/releases/:version"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/releases/release.svelte') } /></Route>
					<Route path="/releases/:version/edit"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/releases/edit.svelte') } /></Route>

					<Route path="/assets"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/assets.svelte') } /></Route>
					<Route path="/assets/create"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/assets/create.svelte') } /></Route>
					<Route path="/assets/:asset"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/assets/edit.svelte') } /></Route>

					<Route path="/tags"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/tags.svelte') } /></Route>
					<Route path="/tags/create"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/tags/create.svelte') } /></Route>
					<Route path="/tags/:tag"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/tags/edit.svelte') } /></Route>

					<Route path="/stats"><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/stats.svelte') } /></Route>
					<Route path="/settings" redirect="settings/general" />
					<Route path="/settings/*" firstmatch><LoadableForRepo {collab} {repo} component={ () => import('./pages/repositories/settings.svelte') } /></Route>
				</Route>
			</PromiseLoader>
		{/if}

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
