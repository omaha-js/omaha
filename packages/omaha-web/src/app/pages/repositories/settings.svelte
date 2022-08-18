<script lang="ts">
	import { Collaboration, Repository } from '@omaha/client';
	import TabGroup from 'src/app/components/tabs/TabGroup.svelte';
	import Tab from 'src/app/components/tabs/Tab.svelte';
	import TabSection from 'src/app/components/tabs/TabSection.svelte';
	import LoadableForRepo from 'src/app/components/helpers/routing/LoadableForRepo.svelte';

	import SettingsIcon from 'tabler-icons-svelte/icons/Settings.svelte';
	import UsersIcon from 'tabler-icons-svelte/icons/Users.svelte';
	import KeyIcon from 'tabler-icons-svelte/icons/Key.svelte';
	import DownloadIcon from 'tabler-icons-svelte/icons/Download.svelte';
	import AuditIcon from 'tabler-icons-svelte/icons/History.svelte';

	export let repo: Repository;
	export let collab: Collaboration;
</script>

<TabGroup base="/repository/{repo.id}/settings">
	<Tab name="General" path="/general" icon={SettingsIcon}>
		<LoadableForRepo {repo} {collab} component={ () => import('./settings/general.svelte') } />
	</Tab>

	<TabSection name="Access" />
	<Tab name="Collaborators" path="/collaborators" icon={UsersIcon}>
		Not implemented!
	</Tab>
	<Tab name="Access tokens" path="/tokens" icon={KeyIcon}>
		Not implemented!
	</Tab>

	<TabSection name="Logs" />
	<Tab name="Download log" path="/logs/downloads" icon={DownloadIcon}>
		Not implemented!
	</Tab>
	<Tab name="Audit log" path="/logs/audit" icon={AuditIcon}>
		Not implemented!
	</Tab>
</TabGroup>
