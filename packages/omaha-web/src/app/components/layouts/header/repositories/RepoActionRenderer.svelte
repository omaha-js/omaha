<script lang="ts">
	import { RepoCustomAction } from '../scripts/repo-actions';

	export let action: RepoCustomAction;

	$: className = (
		`action-button btn-${action.color} ` + ($$props.class ?? '') + ' ' +
		(action.icon ? 'has-icon' : '')
	);

	$: el = typeof action.href !== 'undefined' ? 'a' : 'button';
</script>

<svelte:element this={el} class={className} type="button" on:click={action.click} title={action.title} href={action.href}>
	{#if action.icon}
		<div class="icon">
			{@html action.icon}
		</div>
	{/if}

	{#if action.text}
		{action.text}
	{/if}
</svelte:element>
