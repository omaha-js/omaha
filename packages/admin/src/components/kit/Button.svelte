<script lang="ts">
	import { Color } from 'src/omaha/theme';
	import Loader from '../helpers/Loader.svelte';

	export let href: string | undefined = undefined;
	export let icon: any = undefined;
	export let loading: boolean = false;
	export let color: Color = 'gray';
	export let type: 'button' | 'submit' | 'reset' = 'button';

	$: effectiveColor = loading ? 'gray' : color;
	$: className = (
		`btn btn-${effectiveColor} ` + ($$props.class ?? '') + ' ' + (loading ? 'loading' : '') + ' ' +
		(icon ? 'has-icon' : '')
	);
</script>

{#if href}
	<a {href} class={className}>
		<slot />
	</a>
{:else}
	<button {type} class={className} on:click>
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
