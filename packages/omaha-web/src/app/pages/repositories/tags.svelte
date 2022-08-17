<script lang="ts">
	import { Collaboration, Repository, Tag } from '@omaha/client';
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

	let promise: Promise<Tag[]>;
	$: {
		client.abort();
		promise = client.tags.list(repo.id);
	}

</script>

<RepoActionContainer>
	<RepoRefreshAction on:invoke={ () => repo.id = repo.id } />

	{#if collab.scopes.includes('repo.tags.manage')}
		<RepoCreateAction href="/repository/{repo.id}/tags/create" />
	{/if}
</RepoActionContainer>

<PromiseLoader {promise} let:value={tags}>

	<table class="table themed">
		<thead>
			<tr>
				<th>Tag</th>
				<th>Description</th>
				<th>Created at</th>
				<th>Updated at</th>
			</tr>
		</thead>
		<tbody>
			{#each tags as tag, index}
				<tr>
					<td class="clickable">
						<a href="/repository/{repo.id}/tags/{tag.name}">
							<div class="icon-text-union">
								<File />
								{tag.name}
							</div>
						</a>
					</td>
					<td class="clickable">
						<a href="/repository/{repo.id}/tags/{tag.name}">
							<div class="d-block text-truncate">{tag.description}</div>
						</a>
					</td>
					<td><Time timestamp={tag.created_at} /></td>
					<td><Time timestamp={tag.updated_at} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</PromiseLoader>
