<script lang="ts">
	import { onDestroy } from 'svelte';
	import { repoActions } from '../scripts/repo-actions';

	repoActions.set({
		href: '',
		actions: []
	});

	onDestroy(() => {
		repoActions.set({
			href: '',
			actions: []
		});
	});
</script>

<slot />
