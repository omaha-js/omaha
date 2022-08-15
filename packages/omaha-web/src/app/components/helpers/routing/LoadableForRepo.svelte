<script lang="ts">
	import { Repository } from '@omaha/client';

    export let component: any;
	export let repo: Repository;
</script>

{#await component.then ? component : component()}
    <!-- TODO: Show something as a placeholder -->
{:then Cmp}
   <svelte:component {repo} this={Cmp.default} />
{/await}
