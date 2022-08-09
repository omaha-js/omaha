<script>
	import { account, SessionManager } from 'src/omaha/core/SessionManager';
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

Hello {$account.name}!

<button on:click={ () => SessionManager.clear() }>Sign out</button>
