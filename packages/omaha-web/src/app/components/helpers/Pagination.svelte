<script lang="ts">
	import Button from '../kit/Button.svelte';
	import ChevronLeft from 'tabler-icons-svelte/icons/ChevronLeft.svelte';
	import ChevronLeftMultiple from 'tabler-icons-svelte/icons/ChevronsLeft.svelte';
	import ChevronRight from 'tabler-icons-svelte/icons/ChevronRight.svelte';
	import ChevronRightMultiple from 'tabler-icons-svelte/icons/ChevronsRight.svelte';

	export let current: number | string;
	export let limit: number;

	$: page = Number(current);
	$: startPage = page - 2;
	$: endPage = page + 2;
	$: {
		if (startPage < 1) {
			endPage += 1 - startPage;
			startPage = 1;
		}

		if (endPage > limit) {
			startPage -= endPage - limit;
			endPage = limit;
		}

		startPage = Math.max(1, startPage);
		endPage = Math.min(limit, endPage);
	}

	$: range = Array.from({length: endPage + 1 - startPage}, (v, k) => startPage + k);

	function setPage(page: number) {
		current = page;
	}
</script>

{#if limit > 1}
	<div class="pagination">
		{#if page > 3}
			<Button icon={ChevronLeftMultiple} on:click={ () => setPage(1) } />
		{/if}

		{#if page > 1}
			<Button icon={ChevronLeft} on:click={ () => setPage(page - 1) } />
		{/if}

		{#each range as pageNumber}
			<Button
				color={pageNumber === page ? 'blue' : undefined}
				on:click={ () => setPage(pageNumber) }
			>{pageNumber}</Button>
		{/each}

		{#if page < limit}
			<Button icon={ChevronRight} on:click={ () => setPage(page + 1) } />
		{/if}

		{#if page < limit - 3}
			<Button icon={ChevronRightMultiple} on:click={ () => setPage(limit) } />
		{/if}
	</div>
{/if}
