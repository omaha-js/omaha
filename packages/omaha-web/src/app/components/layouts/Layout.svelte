<script lang="ts">
	import Logo from './header/Logo.svelte';
	import HeaderRepoPicker from './header/HeaderRepoPicker.svelte';
	import HeaderCreateButton from './header/HeaderCreateButton.svelte';
	import HeaderUserDropdown from './header/HeaderUserDropdown.svelte';
	import HeaderRepoNavigation from './header/HeaderRepoNavigation.svelte';
	import { Repository } from '@omaha/client';

	export let repository: Repository | undefined;
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
