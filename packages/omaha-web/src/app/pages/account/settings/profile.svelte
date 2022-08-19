<script lang="ts">
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	const { account } = omaha.session;
	let inputs = {...$account};

	async function onSubmit() {
		try {
			const account = await client.account.update({
				name: inputs.name
			});

			inputs = {...account};
			omaha.alerts.success('Changes saved successfully.', 3500);
		}
		catch (err) {

		}
	}
</script>

<div class="form-container">
	<form class="form" on:submit|preventDefault={ onSubmit }>
		<h1>Profile</h1>

		<div class="form-section">
			{#if $error}
				<div class="alert alert-danger mb-4" role="alert">
					{$error}
				</div>
			{/if}

			<div class="form-group">
				<label for="inputName">Name</label>
				<input type="text" class="form-control half" id="inputName" bind:value={inputs.name}>
			</div>
		</div>

		<div class="form-section">
			<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
		</div>
	</form>
</div>
