<script lang="ts">
	import { Route } from 'tinro';
	import Loadable from './components/helpers/routing/Loadable.svelte';
</script>

<Route path="/actions/*" firstmatch>
	<Route path="/confirm">
		<Loadable component={ import('./pages/actions/confirm.svelte') } />
	</Route>
</Route>
