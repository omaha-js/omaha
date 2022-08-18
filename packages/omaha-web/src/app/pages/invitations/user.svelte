<script lang="ts">
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { meta, router } from 'tinro';

	let route = meta();
	let invitation = $route.params.id;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	$: promise = client.invites.getForAccount(invitation)
		.then(() => client.invites.accept(invitation))
		.then(response => {
			const repo = response.repository;
			router.goto(`/repository/${repo.id}`);
		});
</script>

<PromiseLoader {promise} />
