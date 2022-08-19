<script lang="ts">
	import { Color } from 'src/omaha/helpers/theme';
	import { createEventDispatcher } from 'svelte';
	import Loader from '../helpers/Loader.svelte';

	export let href: string | undefined = undefined;
	export let icon: any = undefined;
	export let loading: boolean = false;
	export let color: Color | undefined = undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	$: effectiveColor = loading ? 'gray' : color ?? '';
	$: className = (
		`btn btn-${effectiveColor} ` + ($$props.class ?? '') + ' ' + (loading ? 'loading' : '') + ' ' +
		(icon ? 'has-icon' : '') + ' ' + (!$$slots['default'] ? 'without-text' : '')
	);

	const dispatch = createEventDispatcher();

	function onClick() {
		if (!loading) {
			dispatch('click');
		}
	}
</script>

{#if href}
	<a {href} class={className}>
		{#if icon}
		<div class="button-icon">
			<svelte:component this={icon} />
		</div>
		{/if}

		{#if loading}
		<div class="button-loader">
			<Loader size={20} />
		</div>
		{/if}

		<div class="btn-text">
			<slot />
		</div>
	</a>
{:else}
	<button {type} class={className} on:click={ onClick }>
		{#if icon}
		<div class="button-icon">
			<svelte:component this={icon} />
		</div>
		{/if}

		{#if loading}
		<div class="button-loader">
			<Loader size={20} />
		</div>
		{/if}

		<slot />
	</button>
{/if}
