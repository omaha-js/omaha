<script lang="ts">
	import Tab from 'src/app/components/tabs/Tab.svelte';
	import TabGroup from 'src/app/components/tabs/TabGroup.svelte';
	import TabSection from 'src/app/components/tabs/TabSection.svelte';

	import ProfileIcon from 'tabler-icons-svelte/icons/User.svelte';
	import NotificationsIcon from 'tabler-icons-svelte/icons/Mail.svelte';
	import SecurityIcon from 'tabler-icons-svelte/icons/ShieldLock.svelte';
	import AccessTokensIcon from 'tabler-icons-svelte/icons/Key.svelte';
	import ArchivesIcon from 'tabler-icons-svelte/icons/FileText.svelte';
	import Loadable from 'src/app/components/helpers/routing/Loadable.svelte';
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
