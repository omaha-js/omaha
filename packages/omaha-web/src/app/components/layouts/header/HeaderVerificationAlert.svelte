<script lang="ts">
	import MailIcon from 'tabler-icons-svelte/icons/AlertCircle.svelte';
	import omaha from 'src/omaha';
	import Button from '../../kit/Button.svelte';
	import { onDestroy } from 'svelte';

	let { account } = omaha.session;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	async function resend() {
		try {
			const response = await client.account.resendVerificationEmail();
			omaha.alerts.success(response.message, 4500);
		}
		catch (err) {
			omaha.alerts.error(err);
		}
	}
</script>

{#if !$account.verified}
	<div class="verification-alert">
		<div class="container">
			<div class="alert-container">
				<div class="alert-icon">
					<MailIcon />
				</div>
				<p>
					Please confirm your email address by clicking the link we've sent you.
				</p>
				<Button type="button" loading={$loading} on:click={resend}>Didn't receive it?</Button>
			</div>
		</div>
	</div>
{/if}
