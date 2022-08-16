<script lang="ts">
	import { Repository } from '@omaha/client';
	import { active, router } from 'tinro';
	import { getActionFromName, repoActions } from './scripts/repo-actions';

	export let repository: Repository;

	$: {
		if ($repoActions.href !== $router.path) {
			$repoActions.actions = [];
		}
	}
</script>

<div class="repo-header">
	<div class="container">
		<nav class="repo-navigation">
			<ul>
				<li><a href="/repository/{repository.id}/releases" use:active={repository}>Releases</a></li>
				<li><a href="/repository/{repository.id}/assets" use:active={repository}>Assets</a></li>
				<li><a href="/repository/{repository.id}/tags" use:active={repository}>Tags</a></li>
				<li><a href="/repository/{repository.id}/stats" use:active={repository}>Stats</a></li>
				<li><a href="/repository/{repository.id}/settings" use:active={repository}>Settings</a></li>
			</ul>
		</nav>
		<div class="repo-actions">
			{#each $repoActions.actions as action}
				<svelte:component this={getActionFromName(action.name)} {action} />
			{/each}
		</div>
	</div>
</div>
