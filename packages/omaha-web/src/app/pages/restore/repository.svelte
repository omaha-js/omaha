<script lang="ts">
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import History from 'tabler-icons-svelte/icons/History.svelte';
	import { meta, router } from 'tinro';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	const route = meta();
	const repoId = route.params.repo_id;

	$: promise = client.repos.getDeleted(repoId);

	async function onRestore() {
		try {
			const response = await client.repos.restore(repoId);
			await omaha.repositories.refresh();

			omaha.alerts.success(response.message, 3000);
			router.goto(`/repository/${repoId}`);
		}
		catch (err) {
			omaha.alerts.error(err);
		}
	}
</script>

<PromiseLoader {promise} let:value={repo}>
	<div class="form-container">
		<div class="heading-group mb-5">
			<h1>Restore {repo.name}</h1>
			<p>
				This repository is currently scheduled for deletion but can still be recovered. Would you like to
				restore this repository now?
			</p>
		</div>

		<Button color="green" icon={History} on:click={onRestore} loading={$loading}>Restore now</Button>
	</div>
</PromiseLoader>
