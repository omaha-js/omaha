<script lang="ts">
	import { RepositoryAccessType, WeeklyDownloadCount } from '@omaha/client';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import PromiseLoader from '../components/helpers/PromiseLoader.svelte';
	import Time from '../components/helpers/Time.svelte';
	import PublicIcon from 'tabler-icons-svelte/icons/Notebook.svelte';
	import PrivateIcon from 'tabler-icons-svelte/icons/Lock.svelte';
	import WeeklyDownloads from '../components/charts/WeeklyDownloads.svelte';
	import DownloadIcon from 'tabler-icons-svelte/icons/ArrowBarToDown.svelte';
	import dayjs from 'dayjs';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let promise = client.repos.overview();
	let downloadRecord: WeeklyDownloadCount | undefined = undefined;
	let activeRepo = '';

	function setRecord(repo?: string, record?: WeeklyDownloadCount) {
		activeRepo = repo ?? '';
		downloadRecord = record;
	}
</script>

<svelte:head><title>{omaha.app.title('Dashboard')}</title></svelte:head>

<PromiseLoader {promise} let:value={results}>
	<div class="repo-list-heading">
		<h1>Repositories</h1>
		<div class="count">{results.length}</div>
	</div>

	<div class="dashboard-list">
		{#each results as { repository, collaboration, downloads, release }}
			<div class="repo-list-item">
				<a href="/repository/{repository.id}" class="repo-overview">
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
				</a>
				<div class="repo-downloads">
					<div class="chart-tooltip">
						<DownloadIcon />
						<div class="datetime">
							{#if downloadRecord && activeRepo == repository.id}
								{dayjs(downloadRecord.date_start).format('YYYY-MM-DD')}
								to
								{dayjs(downloadRecord.date_end).format('YYYY-MM-DD')}
							{:else}
								weekly downloads
							{/if}
						</div>
						<div class="count">
							{#if activeRepo == repository.id}
								{downloadRecord?.downloads}
							{:else}
								{downloads[downloads.length - 1].downloads}
							{/if}
						</div>
					</div>
					<WeeklyDownloads
						history={downloads}
						on:dataset_enter={ (e) => setRecord(repository.id, e.detail) }
						on:dataset_leave={ () => setRecord() }
					/>
				</div>
			</div>
		{:else}
			<p class="no-repositories">
				You're not in any repositories yet. Why not <a href="/repositories/create">create one</a>?
			</p>
		{/each}
	</div>
</PromiseLoader>
