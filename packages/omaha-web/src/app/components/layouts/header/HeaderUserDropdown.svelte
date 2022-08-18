<script lang="ts">
	import omaha from 'src/omaha';
	import Gravatar from '../../helpers/Gravatar.svelte';
	const { account } = omaha.session;
</script>

<div class="header-user">
	<div class="avatar">
		{#if $account}
			<Gravatar email={$account.email} alt={$account.name} size={100} />
		{/if}
	</div>
</div>
