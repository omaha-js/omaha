<script lang="ts">
	import Loader from 'src/app/components/helpers/Loader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { FormGroup, Input } from 'sveltestrap';
	import SaveIcon from 'tabler-icons-svelte/icons/DeviceFloppy.svelte';

	const [api, error, loading, dispose] = omaha.client.useFromComponent();
	const { account } = omaha.session;

	onDestroy(dispose);

	let inputs = {...$account};

	async function onFormSubmit() {
		try {
			if (!loading.get()) {
				const account = await api.account.update({
					name: inputs.name,
					email: inputs.email
				});

				inputs = {...account};
				omaha.alerts.success('Your changes have been saved.');
			}
		}
		catch (err) {
			omaha.alerts.error(err);
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
