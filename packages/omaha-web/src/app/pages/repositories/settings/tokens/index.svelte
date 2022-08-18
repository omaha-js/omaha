<script lang="ts">
	import { Collaboration, Repository } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Time from 'src/app/components/helpers/Time.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import Key from 'tabler-icons-svelte/icons/Key.svelte';
	import DropdownToggle from 'src/app/components/kit/DropdownToggle.svelte';
	import { ButtonDropdown, DropdownItem, DropdownMenu } from 'sveltestrap';
	import DotsVertical from 'tabler-icons-svelte/icons/DotsVertical.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import Plus from 'tabler-icons-svelte/icons/Plus.svelte';

	export let repo: Repository;
	export let collab: Collaboration;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	$: promise = client.repos.tokens.list(repo.id);

	async function deleteToken(id: string) {
		if (confirm('Are you sure you want to delete this token? Any clients or applications using it will stop functioning.')) {
			try {
				const response = await client.repos.tokens.delete(repo.id, id);
				omaha.alerts.success(response.message, 3500);
				repo = repo;
			}
			catch (error) {
				omaha.alerts.error(error);
			}
		}
	}
</script>

<PromiseLoader {promise} let:value={tokens}>
	<div class="heading-with-actions">
		<h1>Tokens</h1>
		<div class="actions">
			{#if collab.scopes.includes('repo.tokens.manage')}
				<Button href="tokens/create" icon={Plus}>Create</Button>
			{/if}
		</div>
	</div>

	<table class="table themed">
		<thead>
			<tr>
				<th scope="col">Token</th>
				<th scope="col">Description</th>
				<th scope="col" class="text-center">Scopes</th>
				<th scope="col">Created</th>
				<th scope="col">Expiration</th>
				<th scope="col"></th>
			</tr>
		</thead>
		<tbody>
			{#each tokens as token (token.id)}
				<tr>
					<td>
						<div class="icon-text-union">
							<Key />
							{token.name}
						</div>
					</td>
					<td>
						<div class="d-block text-truncate">{token.description}</div>
					</td>
					<td class="text-center">{token.scopes.length}</td>
					<td><Time timestamp={token.created_at} /></td>
					<td>
						{#if token.expires_at}
							<Time future timestamp={token.expires_at} />
						{:else}
							Never
						{/if}
					</td>
					<td class="dropdown-column">
						{#if collab.scopes.includes('repo.tokens.manage')}
							<ButtonDropdown class="dropdown">
								<DropdownToggle>
									<DotsVertical />
								</DropdownToggle>
								<DropdownMenu end={true}>
									<DropdownItem href="tokens/{token.id}">Edit</DropdownItem>
									<DropdownItem on:click={ () => deleteToken(token.id) } class="danger">Delete</DropdownItem>
								</DropdownMenu>
							</ButtonDropdown>
						{/if}
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6">No tokens found.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</PromiseLoader>
