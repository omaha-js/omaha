<script lang="ts">
	import { ReleasesCollection, ReleaseSearchRequest, ReleaseSearchResponse, ReleaseStatus, Repository } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Time from 'src/app/components/helpers/Time.svelte';
	import RepoCreateAction from 'src/app/components/layouts/header/repositories/RepoCreateAction.svelte';
	import RepoRefreshAction from 'src/app/components/layouts/header/repositories/RepoRefreshAction.svelte';
	import RepoSearchAction from 'src/app/components/layouts/header/repositories/RepoSearchAction.svelte';
	import SortedTableHeader from 'src/app/components/tables/SortedTableHeader.svelte';
	import ArrowDownCircle from 'tabler-icons-svelte/icons/ArrowDownCircle.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();

	onDestroy(dispose);

	export let repo: Repository;

	let search = '';
	let searchError = false;
	let searchSyntaxError = false;

	let assets = repo.assets!;
	let tags = repo.tags!;

	let params: ReleaseSearchRequest = {
		status: [ReleaseStatus.Published, ReleaseStatus.Archived, ReleaseStatus.Draft],
		include_downloads: true,
		constraint: search,
		sort: 'version',
		sort_order: 'desc',
		tags: [],
		assets: []
	};

	let promise: Promise<ReleaseSearchResponse>;

	$: {
		promise = client.releases.search(repo.id, params);
		promise.then(
			() => searchError = false,
			() => {
				if (typeof params.constraint === 'string' && params.constraint.length > 0) {
					searchError = true;
				}
			}
		);
	}

	function onRefreshAction() {
		client.abort();
		promise = client.releases.search(repo.id, params);
	}

	function onSearchAction(submit = false) {
		const value = search.trim();

		if (!submit && ['^', '>', '<', '=', '.', '-', '+'].includes(value[value.length - 1])) {
			searchSyntaxError = true;
			return;
		}

		searchSyntaxError = false;
		params.constraint = value;

		client.abort();
	}
</script>

<RepoSearchAction
	bind:value={search}
	placeholder="Search for releases..."
	on:typestop={ () => onSearchAction() }
	on:submit={ () => onSearchAction(true) }
	error={searchError || searchSyntaxError}
/>
<RepoRefreshAction on:invoke={onRefreshAction} title="Refresh this list" />
<RepoCreateAction href="/repository/{repo.id}/releases/create" title="Create a new release" />

<PromiseLoader {promise} let:value={response}>
	<div class="row">
		<div class="col-md-9">
			<table class="table themed">
				<thead>
					<tr>
						<th scope="col"></th>
						<SortedTableHeader key="version" bind:currentKey={params.sort} bind:currentDirection={params.sort_order}>
							Version
						</SortedTableHeader>
						<th scope="col">Status</th>
						<th scope="col">Tags</th>
						<SortedTableHeader key="date" bind:currentKey={params.sort} bind:currentDirection={params.sort_order} class="text-end">
							Date
						</SortedTableHeader>
						<th scope="col" class="text-end">Downloads</th>
					</tr>
				</thead>
				<tbody>
					{#each response.results as result (result.version)}
						<tr>
							<td>
								<input type="checkbox" class="form-check-input" />
							</td>
							<td>
								<div class="version-tag">{result.version}</div>
							</td>
							<td>
								<div class="attribute status {result.status}">
									{result.status}
								</div>
							</td>
							<td>
								{#each result.tags ?? [] as tag}
									<div class="attribute tag">
										{tag}
									</div>
								{/each}
							</td>
							<td class="text-end">
								<Time timestamp={result.published_at || result.created_at} />
							</td>
							<td class="text-end">
								<div class="download-count">
									<div class="download-count-flex">
										<strong>{result.download_count}</strong>
										<ArrowDownCircle />
									</div>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="text-center">
								Nothing to show.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="col-md-3">
			<form on:submit|preventDefault={ () => {} }>
				<div class="panel">
					<div class="panel-header">
						Status
					</div>
					<div class="panel-body">
						<div class="attribute-list">
							<label class="attribute-list-item" for="status_published">
								<input
									type="checkbox"
									class="form-check-input"
									bind:group={params.status}
									name="status"
									value={ReleaseStatus.Published}
									id="status_published"
								/>
								<strong>published</strong>
							</label>
							<label class="attribute-list-item" for="status_archived">
								<input
									type="checkbox"
									class="form-check-input"
									bind:group={params.status}
									name="status"
									value={ReleaseStatus.Archived}
									id="status_archived"
								/>
								<strong>archived</strong>
							</label>
							<label class="attribute-list-item" for="status_draft">
								<input
									type="checkbox"
									class="form-check-input"
									bind:group={params.status}
									name="status"
									value={ReleaseStatus.Draft}
									id="status_draft"
								/>
								<strong>draft</strong>
							</label>
						</div>
					</div>
				</div>

				<div class="panel">
					<div class="panel-header">
						Tags
					</div>
					<div class="panel-body">
						<div class="attribute-list">
							{#each tags as tag}
								<label class="attribute-list-item" for="tag_{tag.name}">
									<input
										type="checkbox"
										class="form-check-input"
										bind:group={params.tags}
										name="tags"
										value={tag.name}
										id="tag_{tag.name}"
									/>
									<strong>{tag.name}</strong>
								</label>
							{/each}
						</div>
					</div>
				</div>

				<div class="panel">
					<div class="panel-header">
						Assets
					</div>
					<div class="panel-body">
						<div class="attribute-list">
							{#each assets as asset}
								<label class="attribute-list-item" for="asset_{asset.name}">
									<input
										type="checkbox"
										class="form-check-input"
										bind:group={params.assets}
										name="assets"
										value={asset.name}
										id="asset_{asset.name}"
									/>
									<strong>{asset.name}</strong>
								</label>
							{/each}
						</div>
					</div>
				</div>
			</form>
		</div>
	</div>
</PromiseLoader>
