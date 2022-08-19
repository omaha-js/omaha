<script lang="ts">
	import omaha from 'src/omaha';
	import { onMount } from 'svelte';

	onMount(() => {
		omaha.session.clear();
	});
</script>
