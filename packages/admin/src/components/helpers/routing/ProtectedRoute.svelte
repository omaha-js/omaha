<script lang="ts">
	import { Route } from 'tinro';
	import ProtectedRouteGuard from './ProtectedRouteGuard.svelte';

	/**
	 * The path for this route.
	 */
	export let path: string | undefined = undefined;
	export let fallback: boolean = false;
</script>

<Route {path} {fallback}>
	<ProtectedRouteGuard>
		<slot />
	</ProtectedRouteGuard>
</Route>
