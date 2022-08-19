<script lang="ts">
	import { Scope } from '@omaha/client';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import ScopePicker from 'src/app/components/pages/settings/ScopePicker.svelte';
	import TokenExpiration from 'src/app/components/pages/settings/TokenExpiration.svelte';
	import Clipboard from 'tabler-icons-svelte/icons/Clipboard.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import { router } from 'tinro';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let tokenName = '';
	let tokenDescription = '';
	let tokenScopes = new Array<Scope>();
	let tokenDurationDays = 7;
	let tokenSecret = '';

	const promise = client.auth.scopes();

	async function onSubmit() {
		try {
			const response = await client.account.tokens.create({
				name: tokenName,
				description: tokenDescription,
				scopes: tokenScopes,
				expiration: tokenDurationDays * 86400000
			});

			tokenSecret = response.key;
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}

	function copyToken() {
		navigator.clipboard.writeText(tokenSecret);
		omaha.alerts.success('Token copied to clipboard!', 3500);
	}

	function finish() {
		omaha.alerts.success(`Token created successfully!`, 3500);
		router.goto(`/account/settings/tokens`);
	}
</script>

{#if !tokenSecret}
	<PromiseLoader {promise} let:value>
		<div class="form-container">
			<form class="form" on:submit|preventDefault={ onSubmit }>
				<div class="heading-group">
					<h1>Create an access token</h1>
					<p>
						Access tokens are secret strings that can be used to authenticate with our API and gain access
						to your account. Each token automatically gains read-only access to all of your repositories
						and basic account information. You can assign additional permissions below.
					</p>
				</div>

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

					<div class="form-group">
						<label for="inputExpiration">Expiration</label>
						<TokenExpiration bind:value={tokenDurationDays} />
					</div>
				</div>

				<div class="form-section">
					<div class="form-group">
						<div class="form-label">Permissions</div>
						<ScopePicker bind:selected={tokenScopes} available={value} />
					</div>
				</div>

				<div class="form-section bottom">
					<Button type="submit" color="blue" loading={$loading}>Create token</Button>
				</div>
			</form>
		</div>
	</PromiseLoader>
{:else}
	<div class="form-container">
		<div class="heading-group">
			<h1>Token secret</h1>
			<p>
				Your access token is shown below. Please copy this token and store it somewhere secure. We do not
				store these tokens and cannot show it to you again.
			</p>
		</div>

		<div class="form-section top">
			<div class="token-secret">
				<div class="value">
					{tokenSecret}
				</div>
				<div class="copy-button">
					<Button on:click={copyToken} icon={Clipboard} title="Copy to clipboard" />
				</div>
			</div>
		</div>

		<div class="form-section bottom">
			<Button on:click={finish} color="blue" loading={$loading}>Continue</Button>
		</div>
	</div>
{/if}
