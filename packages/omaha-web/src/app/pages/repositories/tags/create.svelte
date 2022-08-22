<script lang="ts">
	import { Repository } from '@omaha/client';
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { router } from 'tinro';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let tagName = '';
	let tagDescription = '';

	async function onSubmit() {
		try {
			const tag = await client.tags.create(repo.id, {
				name: tagName,
				description: tagDescription
			});

			repo.tags = await client.tags.list(repo.id);
			omaha.alerts.success(`Tag ${tag.name} created successfully!`);

			router.goto(`/repository/${repo.id}/tags`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}
</script>

<svelte:head><title>{omaha.app.title('Create tag', repo.name)}</title></svelte:head>

<div class="form-container">
	<form class="form" on:submit|preventDefault={ onSubmit }>
		<div class="heading-group">
			<h1>Create a new tag</h1>
			<p>
				Tags are used to categorize releases by their stability. Releases must be assigned to at least one tag,
				and can be assigned to multiple at once. Clients can use tags to narrow down the stability of releases
				they wish to receive, or to find the latest version in a particular tag.
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
				<input type="text" class="form-control half" id="inputName" bind:value={tagName}>
			</div>
			<div class="form-group">
				<label for="inputDescription">Description <span class="tip">(optional)</span></label>
				<input type="text" class="form-control" id="inputDescription" bind:value={tagDescription}>
			</div>
		</div>

		<div class="form-section bottom">
			<Button type="submit" color="blue" loading={$loading}>Create tag</Button>
		</div>
	</form>
</div>
