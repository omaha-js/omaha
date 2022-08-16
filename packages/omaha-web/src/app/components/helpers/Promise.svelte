<script lang="ts">
	import Loader from './Loader.svelte';
	import AlertTriangle from 'tabler-icons-svelte/icons/AlertTriangle.svelte';

	type T = $$Generic;
	export let promise: Promise<T>;
</script>

{#await promise}
	<div class="promise loading">
		<Loader size={48} color='gray' />
	</div>
{:then value}
	<slot {value} />
{:catch error}
	<div class="promise error">
		<div class="inner">
			<AlertTriangle />
			<p>{error.message}</p>
		</div>
	</div>
{/await}
