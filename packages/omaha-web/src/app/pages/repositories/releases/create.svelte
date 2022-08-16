<script lang="ts">
	import { RepositoryVersionScheme } from '@omaha/client';
	import { Repository } from '@omaha/client';
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { router } from 'tinro';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let releaseVersion = '';
	let releaseDescription = '';
	let releaseTags = new Array<string>();
	let tags = repo.tags!;

	async function onSubmit() {
		try {
			const release = await client.releases.create(repo.id, {
				version: releaseVersion,
				description: releaseDescription,
				tags: releaseTags
			});

			omaha.alerts.success(`Release ${releaseVersion} created successfully!`);
			router.goto(`/repository/${repo.id}/releases/${release.version}`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}
</script>

<div class="form-container">
	<form class="form" on:submit|preventDefault={ onSubmit }>
		<div class="heading-group">
			<h1>Create a new release</h1>
			<p>
				A release is used to record information and files for the repository at a certain point in time, and
				each release is uniquely identified by its version number.
			</p>
		</div>

		<!-- Basic repository information -->
		<div class="form-section top">
			{#if $error}
				<div class="alert alert-danger mb-4" role="alert">
					{$error}
				</div>
			{/if}

			<div class="form-group">
				<label for="inputName">Version</label>
				<input type="text" class="form-control half" id="inputName" bind:value={releaseVersion}>
			</div>
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
			<Button type="submit" color="blue" loading={$loading}>Create release</Button>
		</div>
	</form>
</div>
