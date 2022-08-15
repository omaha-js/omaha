<script lang="ts">
	import Notebook from 'tabler-icons-svelte/icons/Notebook.svelte';
	import ChevronDown from 'tabler-icons-svelte/icons/ChevronDown.svelte';
	import Star from 'tabler-icons-svelte/icons/Star.svelte';
	import omaha from 'src/omaha';
	import { Repository } from '@omaha/client';

	const { repositories } = omaha.repositories;

	let dropDownActive = false;
	let lastRefreshTime = 0;

	export let repository: Repository | undefined;

	function showDropDown() {
		dropDownActive = !dropDownActive;

		if (dropDownActive && (lastRefreshTime < Date.now() - 30000)) {
			omaha.repositories.refresh();
			lastRefreshTime = Date.now();
		}
	}
</script>

<svelte:window on:click={ () => dropDownActive = false } />

<div class="repo-picker" class:active={ dropDownActive }>
	<div class="repo-picker-input" on:click|stopPropagation={ () => showDropDown() }>
		<div class="repo-icon">
			<Notebook strokeWidth={1.5} />
		</div>
		<div class="repo-name" class:state--no-selection={ !repository } class:state--has-selection={ !!repository }>
			{#if repository}
				{repository.name}
			{:else}
				Select a repository...
			{/if}
		</div>
		<div class="repo-caret">
			<ChevronDown size={28} strokeWidth={1.5} />
		</div>
	</div>

	<div class="repo-list">
		<ul>
			{#each $repositories as repo (repo.id)}
				<li>
					<a class="repo-list-item" href="/repository/{repo.id}">
						<div class="repo-favorite">
							<Star />
						</div>
						<div class="repo-descriptor">
							<div class="repo-name">{repo.name}</div>
							{#if repo.description.length > 0}
								<div class="sep">·</div>
								<div class="repo-description">{repo.description}</div>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</div>
