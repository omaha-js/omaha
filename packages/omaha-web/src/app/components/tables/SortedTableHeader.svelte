<script lang="ts">
	import ArrowUp from 'tabler-icons-svelte/icons/ChevronUp.svelte';
	import ArrowDown from 'tabler-icons-svelte/icons/ChevronDown.svelte';

	export let key: string;
	export let currentKey: string | undefined;
	export let currentDirection: string | undefined;

	function onClick() {
		if (currentKey === key) {
			currentDirection = currentDirection === 'desc' ? 'asc' : 'desc';
		}
		else {
			currentDirection = 'desc';
			currentKey = key;
		}
	}
</script>

<th scope="col" {...$$restProps} class:sortable={true} class:active={currentKey === key} on:click={ onClick }>
	<div {...$$restProps} class:sort-container={true}>
		<div class="sort-title"><slot /></div>
		<div class="sort-direction" class:active={currentKey === key}>
			{#if currentKey === key && currentDirection === 'asc'}
				<ArrowUp />
			{:else}
				<ArrowDown />
			{/if}
		</div>
	</div>
</th>
