<script lang="ts">
	import { Asset, Collaboration, Repository } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Time from 'src/app/components/helpers/Time.svelte';
	import RepoActionContainer from 'src/app/components/layouts/header/repositories/RepoActionContainer.svelte';
	import RepoCreateAction from 'src/app/components/layouts/header/repositories/RepoCreateAction.svelte';
	import RepoRefreshAction from 'src/app/components/layouts/header/repositories/RepoRefreshAction.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import File from 'tabler-icons-svelte/icons/File.svelte';

	export let repo: Repository;
	export let collab: Collaboration;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let promise: Promise<Asset[]>;
	$: {
		client.abort();
		promise = client.assets.list(repo.id);
	}

</script>

<RepoActionContainer>
	<RepoRefreshAction on:invoke={ () => repo.id = repo.id } />

	{#if collab.scopes.includes('repo.assets.manage')}
		<RepoCreateAction href="/repository/{repo.id}/assets/create" />
	{/if}
</RepoActionContainer>

<PromiseLoader {promise} let:value={assets}>

	<table class="table themed">
		<thead>
			<tr>
				<th>Asset</th>
				<th>Description</th>
				<th>Required</th>
				<th>Created at</th>
				<th>Updated at</th>
			</tr>
		</thead>
		<tbody>
			{#each assets as asset, index}
				<tr>
					<td class="clickable">
						<a href="/repository/{repo.id}/assets/{asset.name}">
							<div class="icon-text-union">
								<File />
								{asset.name}
							</div>
						</a>
					</td>
					<td class="clickable">
						<a href="/repository/{repo.id}/assets/{asset.name}">
							<div class="d-block text-truncate">{asset.description}</div>
						</a>
					</td>
					<td>{asset.required ? "Yes" : "No"}</td>
					<td><Time timestamp={asset.created_at} /></td>
					<td><Time timestamp={asset.updated_at} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</PromiseLoader>
