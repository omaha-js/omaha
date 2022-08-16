<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { router } from 'tinro';
	import { registerAction } from '../scripts/repo-actions';

	const emit = createEventDispatcher();

	export let placeholder: string | undefined = undefined;
	export let value: string = '';
	export let error = false;

	$: {
		registerAction($router.path, {
			name: 'search',
			submit: value => emit('submit', value),
			change: v => {
				value = v;
				emit('change');
			},
			typestop: value => emit('typestop', value),
			placeholder,
			value,
			error
		});
	}
</script>
