<script lang="ts">
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let inputEmail = '';
	let inputPassword = '';

	async function onSubmit() {
		try {
			await client.account.update({
				email: inputEmail,
				existingPassword: inputPassword
			});

			await omaha.session.refresh();

			inputEmail = '';
			inputPassword = '';
			omaha.alerts.success('Changes saved successfully.', 3500);
		}
		catch (err) {

		}
	}
</script>

<div class="form-container">
	<form class="form" on:submit|preventDefault={ onSubmit }>
		<h1>Change email</h1>

		<div class="form-section">
			{#if $error}
				<div class="alert alert-danger mb-4" role="alert">
					{$error}
				</div>
			{/if}

			<div class="form-group">
				<label for="inputEmail">New email address</label>
				<input type="email" class="form-control half" id="inputEmail" bind:value={inputEmail} required>
			</div>

			<div class="form-group">
				<label for="inputPassword">Confirm password</label>
				<input type="password" class="form-control half" id="inputPassword" bind:value={inputPassword} required>
			</div>
		</div>

		<div class="form-section save">
			<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
		</div>
	</form>

	<h1 class="spacious">Danger zone</h1>

	<div class="form-section">
		<div class="form-card-container">
			<div class="form-card">
				<div class="details">
					<h3 class="text-danger">Delete your account</h3>
					<p>We'll remove your account, repositories, and any associated data.</p>
				</div>
				<div class="action">
					<Button color="red" on:click={ () => alert('Not implemented!') } loading={$loading}>Delete</Button>
				</div>
			</div>
		</div>
	</div>
</div>
