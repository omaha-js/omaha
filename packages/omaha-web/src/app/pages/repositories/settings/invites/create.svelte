<script lang="ts">
	import { CollaborationRole, Repository, RepositoryScope } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import ScopePicker from 'src/app/components/pages/settings/ScopePicker.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { router } from 'tinro';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let email = '';
	let role = CollaborationRole.Auditor;
	let scopes = new Array<RepositoryScope>();

	const promise = client.auth.scopes();

	async function onSubmit() {
		try {
			await client.invites.create(repo.id, {
				email,
				role,
				scopes: role === CollaborationRole.Custom ? scopes : undefined
			});

			omaha.alerts.success(`Invitation sent successfully!`);
			router.goto(`/repository/${repo.id}/settings/collaborators`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}
</script>

<PromiseLoader {promise} let:value>
	<div class="form-container">
		<form class="form" on:submit|preventDefault={ onSubmit }>
			<div class="heading-group">
				<h1>Create an invitation</h1>
				<p>
					You can use this form to invite others to join your repository as collaborators. Enter their email
					address and the role you'd like to assign. You can also choose the custom role to assign permissions
					manually.
				</p>
			</div>

			<div class="form-section top">
				{#if $error}
					<div class="alert alert-danger mb-4" role="alert">
						{$error}
					</div>
				{/if}

				<div class="form-group">
					<label for="inputEmail">Email address</label>
					<input type="email" class="form-control half" id="inputEmail" bind:value={email}>
				</div>

				<div class="form-group">
					<label for="inputRole">Role</label>
					<select id="inputRole" class="form-select half" bind:value={role}>
						<option value={CollaborationRole.Owner}>Owner</option>
						<option value={CollaborationRole.Manager}>Manager</option>
						<option value={CollaborationRole.Publisher}>Publisher</option>
						<option value={CollaborationRole.Auditor}>Auditor</option>
						<option value={CollaborationRole.Custom}>Custom</option>
					</select>
				</div>
			</div>

			<div class="form-section">
				<div class="form-group">
					<div class="form-label">Permissions</div>
					<ScopePicker bind:selected={scopes} available={value} repo={true} {role} />
				</div>
			</div>

			<div class="form-section bottom">
				<Button type="submit" color="blue" loading={$loading}>Send invitation</Button>
			</div>
		</form>
	</div>
</PromiseLoader>
