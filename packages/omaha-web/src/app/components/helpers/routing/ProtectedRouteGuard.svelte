<script lang="ts">
	import omaha from 'src/omaha';
	import { onMount } from 'svelte';
	import { router } from 'tinro';
	import Loader from '../Loader.svelte';

	const { account, token } = omaha.session;

	let isAuthenticated = false;

	function redirect() {
		const url = $router.url;
		router.goto('/login');

		if (url !== '/' && url !== '/account/logout') {
			router.location.query.set('return', encodeURIComponent(url));
		}
	}

	onMount(() => {
		if ($token === undefined) {
			redirect();
		}
		else {
			isAuthenticated = true;
		}
	});

	$: {
		if (isAuthenticated) {
			if ($token === undefined) {
				isAuthenticated = false;
				redirect();
			}
		}
	}
</script>

{#if isAuthenticated}
	{#if $account}
		<slot />
	{:else}
		<Loader full size={40} theme="gray" message="Retrieving account" />
	{/if}
{:else}
	<Loader full size={40} theme="gray" message="Loading" />
{/if}
