<script lang="ts">
	import { Repository } from '@omaha/client';
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { router } from 'tinro';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let assetName = '';
	let assetDescription = '';
	let assetRequired = false;

	async function onSubmit() {
		try {
			const asset = await client.assets.create(repo.id, {
				name: assetName,
				description: assetDescription,
				required: assetRequired
			});

			repo.assets = await client.assets.list(repo.id);
			omaha.alerts.success(`Asset ${asset.name} created successfully!`);

			router.goto(`/repository/${repo.id}/assets`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}
</script>

<svelte:head><title>{omaha.app.title('Create asset', repo.name)}</title></svelte:head>

<div class="form-container">
	<form class="form" on:submit|preventDefault={ onSubmit }>
		<div class="heading-group">
			<h1>Create a new asset</h1>
			<p>
				Assets are used to store files within releases under known keys. For example, you might create an asset
				for each operating system you support, and then upload the corresponding binaries to each. This makes
				it easy for clients to choose the file that applies to them.
			</p>
		</div>

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
			<Button type="submit" color="blue" loading={$loading}>Create asset</Button>
		</div>
	</form>
</div>
