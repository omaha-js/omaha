<script lang="ts">
	import { router } from 'tinro';
	import CircleCheck from 'tabler-icons-svelte/icons/CircleCheck.svelte';
	import omaha from 'src/omaha';
	import { onDestroy } from 'svelte';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import Button from 'src/app/components/kit/Button.svelte';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	let token = decodeURIComponent(router.location.query.get('token') as string);
	let promise = client.auth.confirm(token);
	let { account } = omaha.session;

	promise.then(() => omaha.session.refresh());
</script>

<svelte:head><title>{omaha.app.title('Confirm email')}</title></svelte:head>

<div class="action-page">
	<PromiseLoader {promise} let:value={response}>
		<div class="promise success">
			<div class="inner d-flex">
				<CircleCheck />
				<p>{response.message}</p>

				{#if !$account}
					<div class="actions">
						<Button href="/login" color="blue">Sign in</Button>
					</div>
				{/if}
			</div>
		</div>
	</PromiseLoader>
</div>
