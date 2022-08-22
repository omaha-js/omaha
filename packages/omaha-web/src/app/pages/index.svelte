<script>
	import omaha from 'src/omaha';

	const { account } = omaha.session;
</script>

<svelte:head><title>{omaha.app.title('Dashboard')}</title></svelte:head>

Hello {$account.name}!

<button on:click={ () => omaha.session.clear() }>Sign out</button>
