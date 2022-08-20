<script lang="ts">
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import NotificationPicker from 'src/app/components/pages/settings/NotificationPicker.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { Repository } from '@omaha/client';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let promise = client.notifications.getForRepository(repo.id);
	let value: any;

	async function onSubmit() {
		try {
			const response = await client.notifications.updateForRepository(repo.id, value);
			omaha.alerts.success(`Preferences saved successfully!`, 3500);
			promise = Promise.resolve(response);
		}
		catch (err) {
			omaha.alerts.error(err);
		}
	}

	async function onSetAll(state: boolean) {
		for (const key in value) {
			value[key] = state;
		}

		onSubmit();
	}

	function hasAnyEnabled(value: any) {
		for (const key in value) {
			if (value[key]) {
				return true;
			}
		}

		return false;
	}
</script>

<PromiseLoader {promise} let:value={response}>
	<div class="form-container">
		<form class="form" on:submit|preventDefault={ onSubmit }>
			<h1>Notifications</h1>

			<div class="form-section">
				<div class="form-group">
					<NotificationPicker {response} bind:value />
				</div>
			</div>

			<div class="form-section save">
				<Button type="submit" color="blue" loading={$loading}>Update preferences</Button>

				{#if hasAnyEnabled(value)}
					<Button type="button" color="gray" loading={$loading} on:click={ () => onSetAll(false) }>Disable all</Button>
					{:else}
					<Button type="button" color="gray" loading={$loading} on:click={ () => onSetAll(true) }>Enable all</Button>
				{/if}
			</div>
		</form>
	</div>
</PromiseLoader>
