<script lang="ts">
	import Loader from 'src/components/helpers/Loader.svelte';
	import Button from 'src/components/kit/Button.svelte';
	import { useApi } from 'src/omaha/core/api/Api';
	import { NotificationManager } from 'src/omaha/core/NotificationManager';
	import { account, token } from 'src/omaha/core/SessionManager';
	import { FormGroup, Input } from 'sveltestrap';
	import SaveIcon from 'tabler-icons-svelte/icons/DeviceFloppy.svelte';

	const [api, error, loading] = useApi();
	let password = '';

	async function onFormSubmit() {
		try {
			if (!loading.get()) {
				await api.request.account.update({
					password
				});

				$token = undefined;
				await api.request.auth.login($account.email, password);

				NotificationManager.success('Your changes have been saved.');
				password = '';
			}
		}
		catch (err) {
			NotificationManager.error(err.message);
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
