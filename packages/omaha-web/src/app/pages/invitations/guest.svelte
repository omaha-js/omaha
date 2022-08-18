<script lang="ts">
	import { onMount } from 'svelte';
	import { meta, router } from 'tinro';

	const route = meta();
	const invitation = route.params.id;
	const invitationToken = router.location.query.get('token');

	onMount(() => {
		router.goto('/login');
		router.location.query.set('invitation', invitation);

		if (typeof invitationToken === 'string') {
			router.location.query.set('invitation_token', invitationToken);
		}
	});
</script>
