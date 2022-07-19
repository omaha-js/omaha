<script lang="ts">
	import { getContext } from 'svelte';
	import { TabSection } from './TabGroup.svelte';

	export let name: string;

	const tab: TabSection = { type: 'section', name };
	const { registerTab } = getContext<any>('@component/tabs');

	registerTab(tab);
</script>
