<script lang="ts">
	import { router } from 'tinro';
	import ExclamationCircle from 'svelte-bootstrap-icons/lib/ExclamationCircle.svelte';
	import Button from '../../components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';

	let inputName = '';
	let inputEmail = '';
	let inputPassword = '';
	let inputRemember = false;

	const [api, error, loading, dispose] = omaha.client.useFromComponent();
	const returnTo = decodeURIComponent($router.query.return ?? '/');
	const returnToParam = returnTo !== '/' ? ('?return=' + encodeURIComponent(returnTo)) : '';

	onDestroy(dispose);

	async function onSubmit() {
		try {
			if (!loading.get()) {
				const response = await api.auth.register({
					name: inputName,
					email: inputEmail,
					password: inputPassword,
				});

				if (!await omaha.session.login(response.token, inputRemember)) {
					$error = "Something went wrong! Try again?";
					return;
				}

				router.goto(returnTo);
			}
		}
		catch (err) {}
	}
</script>

<svelte:head>
	<title>Register</title>
</svelte:head>

<div class="login-wrapper">
	<div class="login-container">
		<div class="login-header">
			<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
				<circle cx="12" cy="12" r="9" />
				<circle cx="12" cy="10" r="3" />
				<path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
			</svg>
			<h1>Register</h1>
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
					<input type="text" bind:value={inputName} class="form-control" placeholder="Full name" autofocus />
				</div>
				<div class="form-group mb-2">
					<!-- svelte-ignore a11y-autofocus -->
					<input type="email" bind:value={inputEmail} class="form-control" placeholder="Email address" />
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
						<Button color="blue" type="submit" loading={$loading}>Create</Button>
					</div>
				</div>
			</form>
		</div>
		<div class="login-footer">
			<p>
				Already have an account?
				<a href="/login{returnToParam}">Log in here!</a>
			</p>
		</div>
	</div>
</div>
