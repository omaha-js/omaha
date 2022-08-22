<script lang="ts">
	import omaha from 'src/omaha';

	import TabGroup from 'src/app/components/tabs/TabGroup.svelte';
	import Tab from 'src/app/components/tabs/Tab.svelte';
	import TabSection from 'src/app/components/tabs/TabSection.svelte';
	import Loadable from 'src/app/components/helpers/routing/Loadable.svelte';
	import { Route } from 'tinro';

	import ProfileIcon from 'tabler-icons-svelte/icons/User.svelte';
	import SecurityIcon from 'tabler-icons-svelte/icons/ShieldLock.svelte';
	import AccessTokensIcon from 'tabler-icons-svelte/icons/Key.svelte';
	import SettingsIcon from 'tabler-icons-svelte/icons/Settings.svelte';
	import NotificationsIcon from 'tabler-icons-svelte/icons/Bell.svelte';
</script>

<svelte:head><title>{omaha.app.title('Settings')}</title></svelte:head>

<h1>Settings</h1>

<TabGroup base="/account/settings">
	<Tab name="Profile" path="/profile" icon={ProfileIcon}>
		<Loadable component={ import('./settings/profile.svelte') } />
	</Tab>
	<Tab name="Account" path="/account" icon={SettingsIcon}>
		<Loadable component={ import('./settings/account.svelte') } />
	</Tab>
	<Tab name="Notifications" path="/notifications" icon={NotificationsIcon}>
		<Loadable component={ import('./settings/notifications.svelte') } />
	</Tab>

	<TabSection name="Access" />

	<Tab name="Password & security" path="/security" icon={SecurityIcon}>
		<Loadable component={ import('./settings/security.svelte') } />
	</Tab>
	<Tab name="Access tokens" path="/tokens" icon={AccessTokensIcon}>
		<Route path="/"><Loadable component={ import('./settings/tokens/index.svelte') } /></Route>
		<Route path="/create"><Loadable component={ import('./settings/tokens/create.svelte') } /></Route>
		<Route path="/:id"><Loadable component={ import('./settings/tokens/edit.svelte') } /></Route>
	</Tab>
</TabGroup>
