<script lang="ts">
	import { Collaboration, Repository } from '@omaha/client';
	import Loader from '../Loader.svelte';

    export let component: any;
	export let repo: Repository;
	export let collab: Collaboration;
</script>

{#await component.then ? component : component()}
	<div class="promise loading">
		<Loader size={48} color='gray' />
	</div>
{:then Cmp}
   <svelte:component {repo} {collab} this={Cmp.default} />
{/await}
