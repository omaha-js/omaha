<script lang="ts">
	import { router } from 'tinro';

	import Logo from './header/Logo.svelte';
	import HeaderRepoPicker from './header/HeaderRepoPicker.svelte';
	import HeaderCreateButton from './header/HeaderCreateButton.svelte';
	import HeaderUserDropdown from './header/HeaderUserDropdown.svelte';
	import { Repository } from '@omaha/client';
	import omaha from 'src/omaha';
import HeaderRepoNavigation from './header/HeaderRepoNavigation.svelte';

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
</script>

<header class:state--with-repo={ !!repository }>
	<div class="main-header">
		<div class="container">
			<div class="header-flex">
				<Logo />
				<HeaderRepoPicker {repository} />
				<HeaderCreateButton />
				<HeaderUserDropdown />
			</div>
		</div>
	</div>

	{#if repository}
		<HeaderRepoNavigation {repository} />
	{/if}
</header>

<main class="content">
	<div class="container">
		<slot />
	</div>
</main>
