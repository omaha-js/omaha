<script lang="ts">
    export let component: any;
</script>

{#await component.then ? component : component()}
    <!-- TODO: Show something as a placeholder -->
{:then Cmp}
   <svelte:component this={Cmp.default} />
{/await}
