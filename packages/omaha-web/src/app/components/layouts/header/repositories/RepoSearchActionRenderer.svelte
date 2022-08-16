<script lang="ts">
	import { RepoSearchAction } from '../scripts/repo-actions';
	import Search from 'tabler-icons-svelte/icons/Search.svelte';
	import { onDestroy } from 'svelte';

	export let action: RepoSearchAction;

	let value = action.value;
	let previousChangeValue = action.value;
	let timeout: NodeJS.Timeout | undefined;

	function onSubmit() {
		deleteTimeout();
		action.submit(value);
	}

	function deleteTimeout() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
	}

	function onChange() {
		if (previousChangeValue !== value) {
			previousChangeValue = value;
			action.change(value);

			deleteTimeout();
			timeout = setTimeout(() => {
				action.typestop(value);
			}, 250);
		}
	}

	onDestroy(() => {
		if (timeout) {
			deleteTimeout();
			timeout = undefined;
		}
	});
</script>

<form class="action-search" on:submit|preventDefault={ onSubmit } class:error={action.error}>
	<label for="repoActionSearch" class="input-icon">
		<Search />
	</label>
	<input
		type="text"
		id="repoActionSearch"
		bind:value
		placeholder={action.placeholder}
		on:change={ onChange }
		on:keydown={ onChange }
		on:keyup={ onChange }
	/>
</form>
