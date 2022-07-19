<script lang="ts">
	import Loader from 'src/components/helpers/Loader.svelte';
	import Tab from 'src/components/tabs/Tab.svelte';
	import TabGroup from 'src/components/tabs/TabGroup.svelte';
	import TabSection from 'src/components/tabs/TabSection.svelte';
	import { Api } from 'src/omaha/core/api/Api';
	import { NotificationManager } from 'src/omaha/core/NotificationManager';

	import { account, SessionManager } from 'src/omaha/core/SessionManager';
	import { FormGroup, Input, TabContent, TabPane } from 'sveltestrap';

	import ProfileIcon from 'tabler-icons-svelte/icons/User.svelte';
	import AccountIcon from 'tabler-icons-svelte/icons/Settings.svelte';
	import NotificationsIcon from 'tabler-icons-svelte/icons/Mail.svelte';
	import SecurityIcon from 'tabler-icons-svelte/icons/ShieldLock.svelte';
	import AccessTokensIcon from 'tabler-icons-svelte/icons/Key.svelte';
	import ArchivesIcon from 'tabler-icons-svelte/icons/FileText.svelte';
	import Loadable from 'src/components/helpers/routing/Loadable.svelte';

	let accountData = {...$account};
	let password = '';
	let isLoggingIn = false;

	async function renewToken(password: string) {
		const response = await fetch('/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: accountData.email,
				password
			})
		});

		const result = await response.json();

		if (result.error) {
			NotificationManager.error('Something went wrong!');
			$account = undefined;
		}
		else if (result.account) {
			SessionManager.set(result.token, result.account, !!localStorage.getItem('token'));
			NotificationManager.success('Logged in with new password successfully!');
			isLoggingIn = false;
		}
	}

	async function onFormSubmit() {
		const response = await Api.patch('/v1/account', {
			name: accountData.name,
			email: accountData.email,
			password: password !== '' ? password : undefined
		});

		const result = await response.json();

		if (result.error) {
			NotificationManager.error(result.message.join(', '));
		}
		else {
			$account = result.account;
			reset();

			if (password !== '') {
				NotificationManager.success('Changes were saved successfully! Hold on while we log you back in.');
				renewToken(password);

				isLoggingIn = true;
				password = '';

				return;
			}

			NotificationManager.success('Changes were saved successfully!');
		}
	}

	function reset() {
		accountData = {...$account};
	}
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<h1>Account settings</h1>

<TabGroup base="/account/settings">
	<Tab name="Profile" path="/profile" icon={ProfileIcon}>
		<Loadable component={ () => import('./settings/profile.svelte') } />
	</Tab>
	<Tab name="Notifications" path="/notifications" icon={NotificationsIcon}>
		This is the notifications tab!
	</Tab>

	<TabSection name="Access" />
	<Tab name="Password & security" path="/security" icon={SecurityIcon}>
		<Loadable component={ () => import('./settings/security.svelte') } />
	</Tab>
	<Tab name="Access tokens" path="/tokens" icon={AccessTokensIcon}>
		This is the notifications tab!
	</Tab>

	<TabSection name="Archives" />
	<Tab name="Security log" path="/logs/security" icon={ArchivesIcon}>
		This is the notifications tab!
	</Tab>
	<Tab name="Access log" path="/logs/access" icon={ArchivesIcon}>
		This is the notifications tab!
	</Tab>
</TabGroup>
