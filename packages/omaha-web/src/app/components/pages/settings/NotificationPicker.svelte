<script lang="ts">
	import { GetAccountNotificationsResponse, GetRepositoryNotificationsResponse } from '@omaha/client';

	export let response: GetAccountNotificationsResponse | GetRepositoryNotificationsResponse;
	export let value: any = undefined;

	if (value === undefined) {
		value = {};

		for (const notification of response.notifications) {
			if (!isAccountDisabled(notification)) {
				value[notification.id] = notification.enabled;
			}
		}
	}

	function isAccountDisabled(notification: any) {
		return typeof notification.account_enabled === 'boolean' && !notification.account_enabled;
	}

	$: filterRepos = response.notifications.filter(item => item.id.startsWith('repo_'));
	$: filterAccount = response.notifications.filter(item => !item.id.startsWith('repo_'));
</script>

<div class="notification-picker">
	{#if filterAccount.length > 0}
		<div class="form-label">For your account</div>
		{#each filterAccount as notification}
			<div class="notification-row">
				<label for="notification_{notification.id}" disabled={isAccountDisabled(notification)}>
					{#if !isAccountDisabled(notification)}
						<input
							type="checkbox"
							class="form-check-input"
							bind:checked={value[notification.id]}
							id="notification_{notification.id}"
						/>
					{:else}
						<input type="checkbox" class="form-check-input" id="notification_{notification.id}" />
					{/if}

					<div class="description">
						{notification.description}
					</div>
				</label>
			</div>
		{/each}

		<div class="form-label mt-4">For your repositories</div>
	{/if}

	{#each filterRepos as notification}
		<div class="notification-row">
			<label
				for="notification_{notification.id}"
				class:disabled={isAccountDisabled(notification)}
				title={isAccountDisabled(notification) ? `You've disabled this notification from your account settings.` : ''}
			>
				<input
					type="checkbox"
					class="form-check-input"
					bind:checked={value[notification.id]}
					id="notification_{notification.id}"
					disabled={isAccountDisabled(notification)}
				/>

				<div class="description">
					{notification.description}
				</div>
			</label>
		</div>
	{/each}
</div>
