<script lang="ts">
	import { getContext } from 'svelte';
	import { Route } from 'tinro';
	import TabContent from './TabContent.svelte';
	import { TabItem } from './TabGroup.svelte';

	export let name: string;
	export let path: string;
	export let icon: any;

	const tab: TabItem = { type: 'tab', name, path, icon };
	const { registerTab } = getContext<any>('@component/tabs');

	registerTab(tab);
</script>

<Route path={path.replace(/\/+$/, '') + '/*'} firstmatch>
	<TabContent {tab}>
		<slot />
	</TabContent>
</Route>
