<script lang="ts">
import omaha from 'src/omaha';

	import { fly } from 'svelte/transition';
	import Notification from './Notification.svelte';

	const { alerts } = omaha.alerts;
</script>

<div class="notifications">
	{#each $alerts as alert (alert.id)}
		<div in:fly="{{ y: -200, duration: 300 }}" out:fly="{{ y: 200, duration: 600 }}">
			<Notification
				title={alert.title}
				message={alert.message}
				color={alert.color}
				icon={alert.icon}
			/>
		</div>
	{/each}
</div>
