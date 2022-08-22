<script lang="ts">
	import omaha from 'src/omaha';

	import { Collaboration, Repository } from '@omaha/client';
	import TabGroup from 'src/app/components/tabs/TabGroup.svelte';
	import Tab from 'src/app/components/tabs/Tab.svelte';
	import TabSection from 'src/app/components/tabs/TabSection.svelte';
	import Loadable from 'src/app/components/helpers/routing/Loadable.svelte';
	import { Route } from 'tinro';

	import SettingsIcon from 'tabler-icons-svelte/icons/Settings.svelte';
	import UsersIcon from 'tabler-icons-svelte/icons/Users.svelte';
	import KeyIcon from 'tabler-icons-svelte/icons/Key.svelte';
	import DownloadIcon from 'tabler-icons-svelte/icons/Download.svelte';
	import NotificationsIcon from 'tabler-icons-svelte/icons/Bell.svelte';

	export let repo: Repository;
	export let collab: Collaboration;
</script>

<svelte:head><title>{omaha.app.title('Settings', repo.name)}</title></svelte:head>

<TabGroup base="/repository/{repo.id}/settings">
	<Tab name="General" path="/general" icon={SettingsIcon}>
		<Loadable {repo} {collab} component={ import('./settings/general.svelte') } />
	</Tab>
	<Tab name="Notifications" path="/notifications" icon={NotificationsIcon}>
		<Loadable {repo} component={ import('./settings/notifications.svelte') } />
	</Tab>

	<TabSection name="Access" />

	<Tab name="Collaborators" path="/collaborators" icon={UsersIcon}>
		<Route path="/invites/create"><Loadable {repo} {collab} component={ import('./settings/invites/create.svelte') } /></Route>
		<Route path="/invites/:id"><Loadable {repo} {collab} component={ import('./settings/invites/edit.svelte') } /></Route>
		<Route path="/"><Loadable {repo} {collab} component={ import('./settings/collaborators/index.svelte') } /></Route>
		<Route path="/:id"><Loadable {repo} {collab} component={ import('./settings/collaborators/edit.svelte') } /></Route>
	</Tab>

	<Tab name="Access tokens" path="/tokens" icon={KeyIcon}>
		<Route path="/"><Loadable {repo} {collab} component={ import('./settings/tokens/index.svelte') } /></Route>
		<Route path="/create"><Loadable {repo} {collab} component={ import('./settings/tokens/create.svelte') } /></Route>
		<Route path="/:id"><Loadable {repo} {collab} component={ import('./settings/tokens/edit.svelte') } /></Route>
	</Tab>

	<TabSection name="Logs" />

	<Tab name="Downloads" path="/logs/downloads" icon={DownloadIcon}>
		<Loadable {repo} {collab} component={ import('./settings/logs/downloads.svelte') } />
	</Tab>
</TabGroup>
