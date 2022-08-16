<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { router } from 'tinro';
	import { registerAction } from '../scripts/repo-actions';

	const emit = createEventDispatcher();

	export let title: string | undefined = undefined;

	function onClick() {
		emit('invoke');
	}

	$: {
		registerAction($router.path, {
			name: 'refresh',
			invoke: onClick,
			title
		});
	}
</script>
