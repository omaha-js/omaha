<script lang="ts">
	import { CollaborationRole, Repository, RepositoryScope } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import ScopePicker from 'src/app/components/pages/settings/ScopePicker.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { meta, router } from 'tinro';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let role = CollaborationRole.Auditor;
	let scopes = new Array<RepositoryScope>();

	const route = meta();
	const promise = Promise.all([
		client.auth.scopes(),
		client.collabs.get(repo.id, route.params.id)
	]);

	promise.then(([_, collab]) => {
		role = collab.role;
		scopes = collab.scopes;
	});

	async function onSubmit() {
		try {
			await client.collabs.update(repo.id, route.params.id, {
				role,
				scopes: role === CollaborationRole.Custom ? scopes : undefined
			});

			omaha.alerts.success(`Changes saved successfully!`, 3500);
			router.goto(`/repository/${repo.id}/settings/collaborators`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}
</script>

<PromiseLoader {promise} let:value={[ scopesList, collab ]}>
	<div class="form-container">
		<form class="form" on:submit|preventDefault={ onSubmit }>
			<h1>Edit collaborator</h1>

			<div class="form-section top">
				{#if $error}
					<div class="alert alert-danger mb-4" role="alert">
						{$error}
					</div>
				{/if}

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
					<ScopePicker bind:selected={scopes} available={scopesList} repo={true} {role} />
				</div>
			</div>

			<div class="form-section bottom">
				<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
			</div>
		</form>
	</div>
</PromiseLoader>
