<script lang="ts">
	import omaha from 'src/omaha';
	import { ButtonDropdown, DropdownItem, DropdownMenu } from 'sveltestrap';
	import Gravatar from '../../helpers/Gravatar.svelte';
	import DropdownToggle from '../../kit/DropdownToggle.svelte';
	const { account } = omaha.session;
</script>

<div class="header-user">
	<ButtonDropdown class="dropdown">
		<DropdownToggle>
			<div class="avatar">
				{#if $account}
					<Gravatar email={$account.email} alt={$account.name} size={100} />
				{/if}
			</div>
		</DropdownToggle>
		<DropdownMenu end={true}>
			<DropdownItem href="/account/settings">Settings</DropdownItem>
			<DropdownItem href="/account/logout">Sign out</DropdownItem>
		</DropdownMenu>
	</ButtonDropdown>
</div>
