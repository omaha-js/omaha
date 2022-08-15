<script lang="ts">
	import Loader from 'src/app/components/helpers/Loader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { FormGroup, Input } from 'sveltestrap';
	import SaveIcon from 'tabler-icons-svelte/icons/DeviceFloppy.svelte';

	const { account } = omaha.session;
	const [api, error, loading, dispose] = omaha.client.useFromComponent();

	let password = '';

	onDestroy(dispose);

	async function onFormSubmit() {
		try {
			if (!loading.get()) {
				await api.account.update({
					password
				});

				omaha.session.token.set(undefined);
				await api.auth.login({
					email: $account!.email,
					password
				});

				omaha.alerts.success('Your changes have been saved.');
				password = '';
			}
		}
		catch (err) {
			omaha.alerts.error(err);
		}
	}
</script>

<form on:submit|preventDefault={ onFormSubmit }>
	<h2>Change password</h2>
	<FormGroup floating label="New password">
		<Input type="password" placeholder="Enter a new password" bind:value={password} />
	</FormGroup>

	<div class="text-end">
		<Button type="submit" color="blue" loading={$loading} icon={SaveIcon}>Save</Button>
	</div>
</form>
