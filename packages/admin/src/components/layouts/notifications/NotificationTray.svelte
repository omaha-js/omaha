<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	import { notifications } from 'src/omaha/core/NotificationManager';
	import Notification from './Notification.svelte';
</script>

<div class="notifications">
	{#each $notifications as notification (notification.id)}
		<div in:fly="{{ y: -200, duration: 300 }}" out:fly="{{ y: 200, duration: 600 }}">
			<Notification
				title={notification.title}
				message={notification.message}
				color={notification.color}
				icon={notification.icon}
			/>
		</div>
	{/each}
</div>
