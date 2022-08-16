<script lang="ts">
	import { RepoCreateAction } from '../scripts/repo-actions';
	import Plus from 'tabler-icons-svelte/icons/Plus.svelte';

	export let action: RepoCreateAction;
</script>

<a class="action-button action-create" type="button" href={action.href} title={action.title}>
	<Plus />
</a>
