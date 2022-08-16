<script lang="ts">
	import { Collaboration, Repository } from '@omaha/client';

    export let component: any;
	export let repo: Repository;
	export let collab: Collaboration;
</script>

{#await component.then ? component : component()}
    <!-- TODO: Show something as a placeholder -->
{:then Cmp}
   <svelte:component {repo} {collab} this={Cmp.default} />
{/await}
