<script lang="ts">
	import { DownloadLogsRequest, Repository } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Time from 'src/app/components/helpers/Time.svelte';
	import Key from 'tabler-icons-svelte/icons/Key.svelte';
	import User from 'tabler-icons-svelte/icons/User.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import Pagination from 'src/app/components/helpers/Pagination.svelte';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let params: DownloadLogsRequest = { page: 1 };
	$: promise = client.downloads.logs(repo.id, params);
</script>

<PromiseLoader {promise} let:value={response}>
	<div class="heading-with-actions">
		<h1>Downloads</h1>
		<div class="actions">
			<Pagination bind:current={params.page} limit={response.pagination.page_count} />
		</div>
	</div>

	<table class="table themed">
		<thead>
			<tr>
				<th scope="col">Date</th>
				<th scope="col">Release</th>
				<th scope="col">Asset</th>
				<th scope="col">Remote address</th>
				<th scope="col">Client</th>
			</tr>
		</thead>
		<tbody>
			{#each response.logs as row}
				<tr>
					<td><Time timestamp={row.time} /></td>
					<td>{row.release.version}</td>
					<td>{row.attachment.asset}</td>
					<td>{row.ip}</td>
					<td>
						{#if row.token}
							<div class="icon-text-union" title="This client was authenticated with a token" class:deleted={!!row.token.deleted_at}>
								<Key />

								{#if row.token.deleted_at}
									<s>{row.token.name}</s>
									<div class="attribute deleted">Deleted</div>
								{:else}
									{row.token.name}
								{/if}
							</div>
						{:else}
							<div class="icon-text-union grayed" title="This client was not authenticated">
								<User />
								Guest
							</div>
						{/if}
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5">Nothing to show.</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<Pagination bind:current={params.page} limit={response.pagination.page_count} />
</PromiseLoader>
