<script lang="ts">
	import { Scope } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import ScopePicker from 'src/app/components/pages/settings/ScopePicker.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { meta, router } from 'tinro';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let tokenName = '';
	let tokenDescription = '';
	let tokenScopes = new Array<Scope>();

	const route = meta();
	const promise = Promise.all([
		client.auth.scopes(),
		client.account.tokens.get(route.params.id)
	]);

	promise.then(([_, token]) => {
		tokenName = token.name;
		tokenDescription = token.description;
		tokenScopes = token.scopes;
	});

	async function onSubmit() {
		try {
			await client.account.tokens.update(route.params.id, {
				name: tokenName,
				description: tokenDescription,
				scopes: tokenScopes
			});

			omaha.alerts.success(`Changes saved successfully!`, 3500);
			router.goto(`/account/settings/tokens`);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}
</script>

<PromiseLoader {promise} let:value={[scopes, _token]}>
	<div class="form-container">
		<form class="form" on:submit|preventDefault={ onSubmit }>
			<h1>Edit access token</h1>

			<div class="form-section top">
				{#if $error}
					<div class="alert alert-danger mb-4" role="alert">
						{$error}
					</div>
				{/if}

				<div class="form-group">
					<label for="inputName">Name</label>
					<input type="text" class="form-control half" id="inputName" bind:value={tokenName}>
				</div>

				<div class="form-group">
					<label for="inputDescription">Description</label>
					<input type="text" class="form-control" id="inputDescription" bind:value={tokenDescription}>
				</div>
			</div>

			<div class="form-section">
				<div class="form-group">
					<div class="form-label">Permissions</div>
					<ScopePicker bind:selected={tokenScopes} available={scopes} />
				</div>
			</div>

			<div class="form-section bottom">
				<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
			</div>
		</form>
	</div>
</PromiseLoader>
