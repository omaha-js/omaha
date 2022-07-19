<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { active } from 'tinro';

	export let base: string;

	let tabs = new Array<TabItem | TabSection>();
	let selectedTab = writable<TabItem>(undefined);

	setContext('@component/tabs', {
		base,
		selectedTab,
		registerTab(tab: TabItem) {
			tabs = tabs.filter(item => item.type === 'section' || item.path !== tab.path);
			tabs.push(tab);

			selectedTab.update(current => {
				if (current?.path === tab.path) {
					return tab;
				}

				return current ?? tab;
			});
		},
	});
</script>

<script context="module" lang="ts">
	export interface TabItem {
		type: 'tab';
		name: string;
		path: string;
		icon: any;
	}

	export interface TabSection {
		type: 'section';
		name: string;
	}
</script>

<div class="tabs">
	<div class="tabs-navigation">
		<ul>
			{#each tabs as tab (tab.name)}
				{#if tab.type === 'section'}
					<li class="tab-separator">
						<div class="tab-section">
							{ tab.name }
						</div>
					</li>
				{:else}
					<li use:active data-href={base + tab.path}>
						<a href={base + tab.path}>
							<div class="tab-icon">
								<svelte:component this={tab.icon} />
							</div>
							<div class="tab-name">
								{tab.name}
							</div>
						</a>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
	<div class="tabs-content">
		<slot />
	</div>
</div>
