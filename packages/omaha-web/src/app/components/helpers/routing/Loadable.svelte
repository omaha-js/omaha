<script lang="ts">
    import Loader from '../Loader.svelte';

    export let component: any;
</script>

{#await component.then ? component : component()}
    <div class="promise loading">
        <Loader size={48} color='gray' />
    </div>
{:then Cmp}
   <svelte:component this={Cmp.default} />
{/await}
