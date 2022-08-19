<script lang="ts">
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';

	const { account } = omaha.session;
	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let inputExistingPassword = '';
	let inputNewPassword = '';
	let inputNewPasswordRepeat = '';

	async function onSubmit() {
		try {
			if (inputNewPassword !== inputNewPasswordRepeat) {
				$error = `Passwords don't match!`;
				return;
			}

			await client.account.update({
				password: inputNewPassword,
				existingPassword: inputExistingPassword
			});

			// Clear the local token
			omaha.session.clearForReauth();

			// Log in again using the new password
			const response = await client.auth.login({
				email: $account.email,
				password: inputNewPassword
			});

			// Update the token
			omaha.session.login(response.token);
			omaha.alerts.success('Changes saved successfully.', 3500);

			inputExistingPassword = '';
			inputNewPassword = '';
			inputNewPasswordRepeat = '';
		}
		catch (err) {}
	}
</script>

<div class="form-container">
	<form class="form" on:submit|preventDefault={ onSubmit }>
		<h1>Change password</h1>

		<div class="form-section">
			{#if $error}
				<div class="alert alert-danger mb-4" role="alert">
					{$error}
				</div>
			{/if}

			<div class="form-group">
				<label for="inputExistingPassword">Existing password</label>
				<input type="password" class="form-control half" id="inputExistingPassword" bind:value={inputExistingPassword} required>
			</div>

			<div class="form-group">
				<label for="inputNewPassword">New password</label>
				<input type="password" class="form-control half" id="inputNewPassword" bind:value={inputNewPassword} required>
			</div>

			<div class="form-group">
				<label for="inputNewPasswordRepeat">Confirm new password</label>
				<input type="password" class="form-control half" id="inputNewPasswordRepeat" bind:value={inputNewPasswordRepeat} required>
			</div>
		</div>

		<div class="form-section save">
			<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
		</div>
	</form>
</div>
