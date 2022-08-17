<script lang="ts">
	import { Release, Repository } from '@omaha/client';
	import { onDestroy } from 'svelte';
	import omaha from 'src/omaha';
	import { meta, router } from 'tinro';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	const route = meta();

	let releaseDescription = '';
	let releaseTags = new Array<string>();
	let tags = repo.tags!;

	const promise = client.releases.get(repo.id, route.params.version);

	promise.then(release => {
		releaseDescription = release.description;
		releaseTags = release.tags!;
	});

	async function onSubmit(release: Release) {
		try {
			await client.releases.update(repo.id, route.params.version, {
				description: releaseDescription,
				tags: releaseTags
			});

			omaha.alerts.success(`Release updated successfully!`);
			router.goto(`/repository/${repo.id}/releases/${release.version}`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}
</script>

<PromiseLoader {promise} let:value={release}>
	<div class="form-container">
		<form class="form" on:submit|preventDefault={ () => onSubmit(release) }>
			<h1>Edit release</h1>

			<!-- Basic repository information -->
			<div class="form-section top">
				{#if $error}
					<div class="alert alert-danger mb-4" role="alert">
						{$error}
					</div>
				{/if}

				<div class="form-group">
					<label for="inputDescription">Description <span class="tip">(optional)</span></label>
					<textarea rows="3" class="form-control" id="inputDescription" bind:value={releaseDescription} />
				</div>
			</div>

			<!-- Tags -->
			<div class="form-section">
				<div class="form-group">
					<div class="form-label">Tags</div>

					<div class="attribute-list">
						{#each tags as tag}
							<label class="attribute-list-item" for="tag_{tag.name}">
								<input
									type="checkbox"
									class="form-check-input"
									bind:group={releaseTags}
									name="tags"
									value={tag.name}
									id="tag_{tag.name}"
								/>
								<strong>{tag.name}</strong>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<div class="form-section bottom">
				<Button type="submit" color="blue" loading={$loading}>Update release</Button>
			</div>
		</form>
	</div>
</PromiseLoader>
