<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { active, router } from 'tinro';

	export let base: string;

	let tabs = new Array<TabItem | TabSection>();
	let selectedTab = writable<TabItem>(undefined);

	setContext('@component/tabs', {
		base,
		selectedTab,
		registerTab(tab: TabItem | TabSection) {
			if (tab.type === 'tab') {
				tabs = tabs.filter(item => item.type === 'section' || item.path !== tab.path);
				tabs.push(tab);

				selectedTab.update(current => {
					if (current?.path === tab.path) {
						return tab;
					}

					return current;
				});
			}
			else {
				tabs = tabs.filter(item => item.type === 'tab' || item.name !== tab.name);
				tabs.push(tab);
			}
		},
	});

	onMount(() => {
		// The following mount logic will remove any sections from the group that have no items
		// This will make it a little easier for parent components to display tabs conditionally
		const exclude = new Array<string>();

		let sectionName: string;
		let sectionItems = 0;

		for (const tab of tabs) {
			if (tab.type === 'section') {
				if (sectionName && sectionItems === 0) {
					exclude.push(sectionName);
				}

				sectionName = tab.name;
				sectionItems = 0;
			}
			else {
				sectionItems++;
			}
		}

		if (sectionName && sectionItems === 0) {
			exclude.push(sectionName);
		}

		tabs = tabs.filter(tab => !exclude.includes(tab.name));
	});

	let ignoreNoSelection = false;

	$: {
		if (!ignoreNoSelection && $selectedTab === undefined) {
			if ($router.path === base) {
				const first = tabs.find(tab => tab.type === 'tab') as TabItem;

				if (first) {
					ignoreNoSelection = true;
					router.goto(
						base.replace(/\/+$/, '') + '/' +
						first.path.replace(/^\/+/, '')
					);
				}
			}
		}
		else {
			ignoreNoSelection = false;
		}
	}
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
