<script lang="ts">
	import omaha from 'src/omaha';
	import { bootstrapped } from 'src/omaha/bootstrap';
	import { router, Route } from 'tinro';
	import Loader from './components/helpers/Loader.svelte';
	import Loadable from './components/helpers/routing/Loadable.svelte';
	import ProtectedRoute from './components/helpers/routing/ProtectedRoute.svelte';
	import Layout from './components/layouts/Layout.svelte';
	import NotificationTray from './components/layouts/notifications/NotificationTray.svelte';
	import { Collaboration, Repository } from '@omaha/client';
	import PromiseLoader from './components/helpers/PromiseLoader.svelte';
	import { setContext } from 'svelte';
import ActionRoutes from './ActionRoutes.svelte';

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

<svelte:window on:focus={ () => omaha.session.refresh() } />

{#if !$bootstrapped}
	<Loader full size={40} theme="gray" message="Loading" />
{:else if $account}

	<Layout {repository}>
		<Route path="/"><Loadable component={ import('./pages/index.svelte') } /></Route>

		<!-- Repository management (account side) -->
		<Route path="/repositories/create"><Loadable component={ import('./pages/repositories/create.svelte') } /></Route>

		<!-- Repositories -->
		{#if repository && collab && repositoryPromise}
			<PromiseLoader promise={repositoryPromise} let:value={repo}>
				<Route path="/repository/:repo_id/*" firstmatch>
					<Route path="/" redirect="releases" />
					<Route path="/releases"><Loadable {collab} {repo} component={ import('./pages/repositories/releases.svelte') } /></Route>
					<Route path="/releases/create"><Loadable {collab} {repo} component={ import('./pages/repositories/releases/create.svelte') } /></Route>
					<Route path="/releases/:version"><Loadable {collab} {repo} component={ import('./pages/repositories/releases/release.svelte') } /></Route>
					<Route path="/releases/:version/edit"><Loadable {collab} {repo} component={ import('./pages/repositories/releases/edit.svelte') } /></Route>

					<Route path="/assets"><Loadable {collab} {repo} component={ import('./pages/repositories/assets.svelte') } /></Route>
					<Route path="/assets/create"><Loadable {collab} {repo} component={ import('./pages/repositories/assets/create.svelte') } /></Route>
					<Route path="/assets/:asset"><Loadable {collab} {repo} component={ import('./pages/repositories/assets/edit.svelte') } /></Route>

					<Route path="/tags"><Loadable {collab} {repo} component={ import('./pages/repositories/tags.svelte') } /></Route>
					<Route path="/tags/create"><Loadable {collab} {repo} component={ import('./pages/repositories/tags/create.svelte') } /></Route>
					<Route path="/tags/:tag"><Loadable {collab} {repo} component={ import('./pages/repositories/tags/edit.svelte') } /></Route>

					<Route path="/stats"><Loadable {collab} {repo} component={ import('./pages/repositories/stats.svelte') } /></Route>
					<Route path="/settings/*" firstmatch><Loadable {collab} {repo} component={ import('./pages/repositories/settings.svelte') } /></Route>
				</Route>
			</PromiseLoader>
		{/if}

		<!-- Restore repositories -->
		<Route path="/restore/repository/:repo_id"><Loadable component={ import('./pages/restore/repository.svelte') } /></Route>

		<!-- Invitations -->
		<Route path="/invitation/:id"><Loadable component={ import('./pages/invitations/user.svelte') } /></Route>

		<!-- Account -->
		<Route path="/account/settings/*"><Loadable component={ import('./pages/account/settings.svelte') } /></Route>
		<Route path="/account/logout"><Loadable component={ import('./pages/account/logout.svelte') } /></Route>

		<!-- Global -->
		<ActionRoutes />
	</Layout>
{:else}
	<Route>
		<Route path="/login"><Loadable component={ import('./pages/guard/login.svelte') } /></Route>
		<Route path="/register"><Loadable component={ import('./pages/guard/register.svelte') } /></Route>
		<Route path="/invitation/:id"><Loadable component={ import('./pages/invitations/guest.svelte') } /></Route>
		<ActionRoutes />
		<ProtectedRoute fallback />
	</Route>
{/if}

<NotificationTray />
