<script lang="ts">
	import { Color } from 'src/omaha/helpers/theme';
	import { createEventDispatcher } from 'svelte';
	import { router } from 'tinro';
	import { registerAction } from '../scripts/repo-actions';

	export let href: string | undefined = undefined;
	export let title: string | undefined = undefined;
	export let text: string | undefined = undefined;
	export let color: Color | undefined = undefined;

	let iconElement: HTMLDivElement;

	const emit = createEventDispatcher();

	$: {
		registerAction($router.path, {
			name: 'custom',
			href,
			title,
			text,
			icon: iconElement ? iconElement.innerHTML : undefined,
			color,
			click: () => emit('click')
		});
	}
</script>

<div class="hidden" bind:this={iconElement}><slot name="icon" /></div>

<style lang="scss">
	.hidden { display: none; }
</style>
