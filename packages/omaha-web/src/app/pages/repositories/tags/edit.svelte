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

	let tagDescription = '';

	const route = meta();
	const promise = client.tags.get(repo.id, route.params.tag);

	promise.then(tag => {
		tagDescription = tag.description;
	});

	async function onSubmit() {
		try {
			await client.tags.update(repo.id, route.params.tag, {
				description: tagDescription
			});

			repo.tags = await client.tags.list(repo.id);
			omaha.alerts.success(`Changes saved successfully.`);

			router.goto(`/repository/${repo.id}/tags`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}

	async function deleteTag() {
		if (confirm('Are you sure you want to delete this tag? This action cannot be undone!')) {
			try {
				await client.tags.delete(repo.id, route.params.tag);

				repo.tags = await client.tags.list(repo.id);
				omaha.alerts.success(`Tag deleted successfully.`);

				router.goto(`/repository/${repo.id}/tags`);
			}
			catch (err) {
				omaha.alerts.error(err);
				$error = undefined;
			}
		}
	}
</script>

<RepoActionContainer>
	<RepoAction key="delete" title="Delete this tag" on:click={ deleteTag }>
		<Trash slot="icon" />
	</RepoAction>
</RepoActionContainer>

<PromiseLoader {promise} let:value>
	<div class="form-container">
		<form class="form" on:submit|preventDefault={ onSubmit }>
			<h1>Edit {value.name}</h1>

			<div class="form-section top">
				{#if $error}
					<div class="alert alert-danger mb-4" role="alert">
						{$error}
					</div>
				{/if}

				<div class="form-group">
					<label for="inputDescription">Description <span class="tip">(optional)</span></label>
					<input type="text" class="form-control" id="inputDescription" bind:value={tagDescription}>
				</div>
			</div>

			<div class="form-section bottom">
				<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
			</div>
		</form>
	</div>
</PromiseLoader>
