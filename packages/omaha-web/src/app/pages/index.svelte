<script lang="ts">
	import { RepositoryAccessType } from '@omaha/client';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import PromiseLoader from '../components/helpers/PromiseLoader.svelte';
	import Time from '../components/helpers/Time.svelte';
	import PublicIcon from 'tabler-icons-svelte/icons/Notebook.svelte';
	import PrivateIcon from 'tabler-icons-svelte/icons/Lock.svelte';
import WeeklyDownloads from '../components/charts/WeeklyDownloads.svelte';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let promise = client.repos.overview();
</script>

<svelte:head><title>{omaha.app.title('Dashboard')}</title></svelte:head>

<PromiseLoader {promise} let:value={results}>
	<div class="repo-list-heading">
		<h1>Repositories</h1>
		<div class="count">{results.length}</div>
	</div>

	<div class="dashboard-list">
		{#each results as { repository, collaboration, downloads, release }}
			<a href="/repository/{repository.id}" class="repo-list-item">
				<div class="repo-overview">
					<div class="repo-name">
						<div>
							{#if repository.access === RepositoryAccessType.Public}
								<PublicIcon />
							{:else}
								<PrivateIcon />
							{/if}
						</div>
						<div>{repository.name}</div>
					</div>
					<div class="repo-description">{repository.description}</div>
					<div class="repo-details">
						<div class="repo-version">
							{#if release}
								<span class="version-tag">{release.version}</span>
								<span class="sep">·</span>
								<span><Time timestamp={release.published_at} /></span>
							{:else}
								<span>Not published</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="download-graph">
					<WeeklyDownloads history={downloads} />
				</div>
			</a>
		{:else}
			<p class="no-repositories">
				You're not in any repositories yet. Why not <a href="/repositories/create">create one</a>?
			</p>
		{/each}
	</div>
</PromiseLoader>
