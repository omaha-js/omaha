<script lang="ts">
	import { RepoRefreshAction } from '../scripts/repo-actions';
	import Refresh from 'tabler-icons-svelte/icons/Refresh.svelte';

	export let action: RepoRefreshAction;
</script>

<button class="action-button action-refresh" type="button" on:click={action.invoke} title={action.title}>
	<Refresh />
</button>
