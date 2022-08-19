<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { TabItem } from './TabGroup.svelte';
	const { selectedTab } = getContext<any>('@component/tabs');

	export let tab: TabItem;

	onMount(() => {
		$selectedTab = tab;

		return () => {
			$selectedTab = undefined;
		}
	});
</script>

<div class="tab-panel">
	<slot />
</div>
