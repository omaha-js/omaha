<script lang="ts">
	import { account, token } from 'src/omaha/core/SessionManager';
	import { onMount } from 'svelte';
	import { router } from 'tinro';
	import Loader from '../Loader.svelte';

	let isAuthenticated = false;

	function redirect() {
		const url = $router.url;
		router.goto('/login');

		if (url !== '/') {
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
