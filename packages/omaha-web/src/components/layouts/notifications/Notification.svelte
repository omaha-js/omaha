<script lang="ts">
	import { Color, NotificationIcon } from 'src/omaha/theme';
	import CircleCheck from 'tabler-icons-svelte/icons/CircleCheck.svelte';
	import AlertCircle from 'tabler-icons-svelte/icons/AlertCircle.svelte';
	import InfoCircle from 'tabler-icons-svelte/icons/InfoCircle.svelte';

	/**
	 * The highlight color of the notification.
	 */
	export let color: Color;

	/**
	 * The icon to use for the notification.
	 */
	export let icon: NotificationIcon;

	/**
	 * The title of the notification.
	 */
	export let title: string;

	/**
	 * The message content of the notification.
	 */
	export let message: string;
</script>

<div class="notification {color}">
	<div class="notification-icon">
		{#if icon === 'checkmark'}
			<CircleCheck />
		{:else if icon === 'alert'}
			<AlertCircle />
		{:else if icon === 'info'}
			<InfoCircle />
		{/if}
	</div>
	<div class="notification-content">
		<h4>{title}</h4>
		<p>{message}</p>
	</div>
</div>
