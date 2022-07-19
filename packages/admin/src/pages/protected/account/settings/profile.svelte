<script lang="ts">
	import Loader from 'src/components/helpers/Loader.svelte';
	import Button from 'src/components/kit/Button.svelte';
	import { useApi } from 'src/omaha/core/api/Api';
	import { NotificationManager } from 'src/omaha/core/NotificationManager';
	import { account } from 'src/omaha/core/SessionManager';
	import { FormGroup, Input } from 'sveltestrap';
	import SaveIcon from 'tabler-icons-svelte/icons/DeviceFloppy.svelte';

	const [api, error, loading] = useApi();
	let inputs = {...$account};

	async function onFormSubmit() {
		try {
			if (!loading.get()) {
				const account = await api.request.account.update({
					name: inputs.name,
					email: inputs.email
				});

				inputs = {...account};
				NotificationManager.success('Your changes have been saved.');
			}
		}
		catch (err) {
			NotificationManager.error(err.message);
		}
	}
</script>

<form on:submit|preventDefault={ onFormSubmit }>
	<h2>Your information</h2>
	<FormGroup floating label="Name">
		<Input placeholder="Enter a name" bind:value={inputs.name} />
	</FormGroup>

	<FormGroup floating label="Email address">
		<Input type="email" placeholder="Enter an email address" bind:value={inputs.email} />
	</FormGroup>

	<!--
	<FormGroup floating label="New password">
		<Input type="password" placeholder="Enter a new password" bind:value={password} />
	</FormGroup>
	-->

	<div class="text-end">
		<Button type="submit" color="blue" loading={$loading} icon={SaveIcon}>Save</Button>
	</div>
</form>

{#if false}
	<Loader full size={40} theme="gray" message="Restoring session" />
{/if}
