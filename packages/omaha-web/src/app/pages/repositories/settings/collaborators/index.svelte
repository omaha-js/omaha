<script lang="ts">
	import { Collaboration, Repository } from '@omaha/client';
	import Gravatar from 'src/app/components/helpers/Gravatar.svelte';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Time from 'src/app/components/helpers/Time.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import DropdownToggle from 'src/app/components/kit/DropdownToggle.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { ButtonDropdown, DropdownItem, DropdownMenu } from 'sveltestrap';
	import DotsVertical from 'tabler-icons-svelte/icons/DotsVertical.svelte';
	import Plus from 'tabler-icons-svelte/icons/Plus.svelte';

	export let repo: Repository;
	export let collab: Collaboration;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	$: promise = client.collabs.list(repo.id);

	async function deleteInvite(id: string) {
		if (confirm('Are you sure you want to delete this invitation?')) {
			try {
				const response = await client.invites.delete(repo.id, id);
				omaha.alerts.success(response.message, 3500);
				repo = repo;
			}
			catch (error) {
				omaha.alerts.error(error);
			}
		}
	}

	async function deleteCollaborator(id: string, name: string) {
		const privatestr = repo.access === 'public' ?
			'They will only have public access to this repository going forward.' :
			'They will no longer be able to access this repository.';

		if (confirm(`Are you sure you want to remove ${name} as a collaborator? ${privatestr} This cannot be undone!`)) {
			try {
				const response = await client.collabs.delete(repo.id, id);
				omaha.alerts.success(response.message, 3500);
				repo = repo;
			}
			catch (error) {
				omaha.alerts.error(error);
			}
		}
	}

	function copyLink(id: string) {
		const url = new URL(document.URL);
		url.pathname = '/invitation/' + id;
		url.search = '';
		url.hash = '';

		navigator.clipboard.writeText(url.href);
		omaha.alerts.success('Invitation link copied to clipboard!', 3500);
	}
</script>

<PromiseLoader {promise} let:value={{ collaborations, invites }}>
	<h1>Collaborators</h1>

	<table class="table themed">
		<thead>
			<tr>
				<th scope="col">Name</th>
				<th scope="col">Email</th>
				<th scope="col">Role</th>
				<th scope="col">Since</th>
				<th scope="col"></th>
			</tr>
		</thead>
		<tbody>
			{#each collaborations as row (row.id)}
				<tr>
					<td>
						<div class="avatar-text-union">
							<Gravatar email={row.account.email} alt={row.account.name} size={64} />
							{row.account?.name}
						</div>
					</td>
					<td>{row.account.email}</td>
					<td><div class="attribute role {row.role}">{row.role}</div></td>
					<td><Time timestamp={row.created_at} /></td>
					<td class="dropdown-column">
						{#if collab.scopes.includes('repo.collaborations.manage') && collab.id !== row.id}
							<ButtonDropdown class="dropdown">
								<DropdownToggle>
									<DotsVertical />
								</DropdownToggle>
								<DropdownMenu end={true}>
									<DropdownItem href="collaborators/{row.id}">Edit</DropdownItem>
									<DropdownItem on:click={ () => deleteCollaborator(row.id, row.account.name) } class="danger">Remove</DropdownItem>
								</DropdownMenu>
							</ButtonDropdown>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if collab.scopes.includes('repo.collaborations.manage')}
	<div class="heading-with-actions mt-5">
		<h1>Invitations</h1>
		<div class="actions">
			<Button href="collaborators/invites/create" icon={Plus}>Create</Button>
		</div>
	</div>

	<table class="table themed">
		<thead>
			<tr>
				<th scope="col">Email</th>
				<th scope="col">Role</th>
				<th scope="col">Created</th>
				<th scope="col">Expiration</th>
				<th scope="col"></th>
			</tr>
		</thead>
		<tbody>
			{#each invites as invite (invite.id)}
				<tr>
					<td>
						<div class="avatar-text-union">
							<Gravatar email={invite.email} alt={invite.email} size={64} />
							{invite.email}
						</div>
					</td>
					<td><div class="attribute role {invite.role}">{invite.role}</div></td>
					<td><Time timestamp={invite.created_at} /></td>
					<td><Time future timestamp={invite.expires_at} /></td>
					<td class="dropdown-column">
						<ButtonDropdown class="dropdown">
							<DropdownToggle>
								<DotsVertical />
							</DropdownToggle>
							<DropdownMenu end={true}>
								<DropdownItem href="collaborators/invites/{invite.id}">Edit</DropdownItem>
								<DropdownItem on:click={ () => copyLink(invite.id) }>Copy link</DropdownItem>
								<DropdownItem on:click={ () => deleteInvite(invite.id) } class="danger">Delete</DropdownItem>
							</DropdownMenu>
						</ButtonDropdown>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="4">
						No invitations found.
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{/if}
</PromiseLoader>
