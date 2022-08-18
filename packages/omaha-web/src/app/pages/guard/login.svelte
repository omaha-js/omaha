<script lang="ts">
	import { router } from 'tinro';
	import Lock from 'tabler-icons-svelte/icons/Lock.svelte';
	import AlertCircle from 'tabler-icons-svelte/icons/AlertCircle.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';

	let inputEmail = '';
	let inputPassword = '';
	let inputRemember = false;

	const [api, error, loading, dispose] = omaha.client.useFromComponent();

	$: returnTo = decodeURIComponent($router.query.return ?? '/');
	let params = '';

	$: {
		const search = new URLSearchParams();

		if (returnTo !== '/') {
			search.set('return', $router.query.return);
		}

		if ($router.query.invitation) {
			search.set('invitation', $router.query.invitation);
		}

		if ($router.query.invitation_token) {
			search.set('invitation_token', $router.query.invitation_token);
		}

		params = search.toString();

		if (params.length > 0) {
			params = '?' + params;
		}
	}

	onDestroy(dispose);

	async function onSubmit() {
		try {
			if (!loading.get()) {
				const response = await api.auth.login({
					email: inputEmail,
					password: inputPassword
				});

				if (!await omaha.session.login(response.token, inputRemember)) {
					$error = "Something went wrong! Try again?";
					return;
				}

				if ($router.query.invitation) {
					const id = $router.query.invitation;
					router.goto(`/invitation/${id}`);

					if ($router.query.invitation_token) {
						router.location.query.set('token', $router.query.invitation_token);
					}

					return;
				}

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
					<AlertCircle size={28} />
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
				<a href="/register{params.toString()}">Create one!</a>
			</p>
		</div>
	</div>
</div>
