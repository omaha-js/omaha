<script lang="ts">
	import { Repository } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import RepoAction from 'src/app/components/layouts/header/repositories/RepoAction.svelte';
	import RepoActionContainer from 'src/app/components/layouts/header/repositories/RepoActionContainer.svelte';
	import Trash from 'tabler-icons-svelte/icons/Trash.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { meta, router } from 'tinro';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let assetName = '';
	let assetDescription = '';
	let assetRequired = false;

	const route = meta();
	const promise = client.assets.get(repo.id, route.params.asset);

	promise.then(asset => {
		assetName = asset.name;
		assetDescription = asset.description;
		assetRequired = asset.required;
	});

	async function onSubmit() {
		try {
			await client.assets.update(repo.id, route.params.asset, {
				name: assetName,
				description: assetDescription,
				required: assetRequired
			});

			repo.assets = await client.assets.list(repo.id);
			omaha.alerts.success(`Changes saved successfully.`);

			router.goto(`/repository/${repo.id}/assets`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}

	async function deleteAsset() {
		if (confirm('Are you sure you want to delete this asset? This action cannot be undone!')) {
			try {
				await client.assets.delete(repo.id, route.params.asset);

				repo.assets = await client.assets.list(repo.id);
				omaha.alerts.success(`Asset deleted successfully.`);

				router.goto(`/repository/${repo.id}/assets`);
			}
			catch (err) {
				omaha.alerts.error(err);
				$error = undefined;
			}
		}
	}
</script>

<RepoActionContainer>
	<RepoAction key="delete" title="Delete this asset" on:click={ deleteAsset }>
		<Trash slot="icon" />
	</RepoAction>
</RepoActionContainer>

<PromiseLoader {promise}>
	<div class="form-container">
		<form class="form" on:submit|preventDefault={ onSubmit }>
			<h1>Edit asset</h1>

			<div class="form-section top">
				{#if $error}
					<div class="alert alert-danger mb-4" role="alert">
						{$error}
					</div>
				{/if}

				<div class="form-group">
					<label for="inputName">Name</label>
					<input type="text" class="form-control half" id="inputName" bind:value={assetName}>
				</div>
				<div class="form-group">
					<label for="inputDescription">Description <span class="tip">(optional)</span></label>
					<input type="text" class="form-control" id="inputDescription" bind:value={assetDescription}>
				</div>
				<div class="form-group">
					<label for="inputRequired">Required before publishing?</label>
					<input type="checkbox" class="form-check-input" id="inputRequired" bind:checked={assetRequired}>
				</div>
			</div>

			<div class="form-section bottom">
				<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
			</div>
		</form>
	</div>
</PromiseLoader>
