<script lang="ts">
	import { router } from 'tinro';
	import Lock from 'tabler-icons-svelte/icons/Lock.svelte';
	import ExclamationCircle from 'svelte-bootstrap-icons/lib/ExclamationCircle.svelte';
	import { useApi } from 'src/omaha/core/api/Api';
	import Button from 'src/components/kit/Button.svelte';

	let inputEmail = '';
	let inputPassword = '';
	let inputRemember = false;

	const [api, error, loading] = useApi();
	const returnTo = decodeURIComponent($router.query.return ?? '/');
	const returnToParam = returnTo !== '/' ? ('?return=' + encodeURIComponent(returnTo)) : '';

	async function onSubmit() {
		try {
			if (!loading.get()) {
				await api.request.auth.login(inputEmail, inputPassword, inputRemember);
				router.goto(returnTo);
			}
		}
		catch (err) {}
	}
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<div class="login-wrapper">
	<div class="login-container">
		<div class="login-header">
			<Lock size={28} />
			<h1>Login</h1>
		</div>

		<div class="login-content">
			<form on:submit|preventDefault={ onSubmit }>
				{#if $error}
				<div class="form-error mb-3">
					<ExclamationCircle />
					<p>{$error}</p>
				</div>
				{/if}
				<div class="form-group mb-2">
					<!-- svelte-ignore a11y-autofocus -->
					<input type="email" bind:value={inputEmail} class="form-control" placeholder="Email address" autofocus />
				</div>
				<div class="form-group mb-3">
					<input type="password" bind:value={inputPassword} class="form-control" placeholder="Password" />
				</div>
				<div class="d-flex justify-content-between align-items-center">
					<div>
						<div class="form-check">
							<input class="form-check-input" type="checkbox" value="" id="remember" bind:checked={inputRemember}>
							<label class="form-check-label" for="remember">
								Remember me
							</label>
						</div>
					</div>
					<div>
						<Button type="submit" color="blue" loading={$loading}>Log in</Button>
					</div>
				</div>
			</form>
		</div>
		<div class="login-footer">
			<p>
				Don't have an account yet?
				<a href="/register{returnToParam}">Create one!</a>
			</p>
		</div>
	</div>
</div>
