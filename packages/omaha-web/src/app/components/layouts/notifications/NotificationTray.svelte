<script lang="ts">
	import omaha from 'src/omaha';
	import { fly, FlyParams } from 'svelte/transition';
	import Notification from './Notification.svelte';

	const { alerts } = omaha.alerts;

	function flyfade(node: Element, params: FlyParams) {
		node.classList.add('notification-fading');
		return fly(node, params);
	}
</script>

<div class="notifications">
	{#each $alerts as alert (alert.id)}
		<div in:fly="{{ y: -200, duration: 300 }}" out:flyfade="{{ y: 200, duration: 600 }}">
			<Notification
				title={alert.title}
				message={alert.message}
				color={alert.color}
				icon={alert.icon}
			/>
		</div>
	{/each}
</div>
