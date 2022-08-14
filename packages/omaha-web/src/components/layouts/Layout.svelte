<script lang="ts">
	// import AccountNavigation from './admin/AccountNavigation.svelte';
	// import RepoNavigation from './admin/RepoNavigation.svelte';
	// import RepoSwitcher from './admin/RepoSwitcher.svelte';

	import Logo from './header/Logo.svelte';
	import HeaderRepoPicker from './header/HeaderRepoPicker.svelte';
	import HeaderCreateButton from './header/HeaderCreateButton.svelte';
	import HeaderUserDropdown from './header/HeaderUserDropdown.svelte';

</script>

<header>
	<div class="container">
		<div class="header-flex">
			<Logo />
			<HeaderRepoPicker />
			<HeaderCreateButton />
			<HeaderUserDropdown />
		</div>
	</div>
</header>

<!--
<div class="layout layout-admin">
	<div class="sidebar">
		<div class="sidebar-wrapper">
			<div class="sidebar-header">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31.87 32">
					<g>
						<path d="M15.24,8a.71.71,0,1,1-.72.71A.71.71,0,0,1,15.24,8m-2-2.82C21.47,1.89,22.56,14.06,23.59,19c1,4.72,2.84,4.23,4.68,3.49l1.55-1.55a7.07,7.07,0,0,0,0-9.95L20.91,2.05a7.07,7.07,0,0,0-9.95,0L2.05,11a7.07,7.07,0,0,0,0,10l8.65,8.65c-1.39-2.16-1.26-4.74-1.37-8.1C9.16,16.31,6.58,27.87,6.07,20c-.2-3,5.85-6.8,5.19-4.91C9,21.7,12.89,37.83,20.91,29.82l4.59-4.6c-1.78.83-5.11,1.19-4.83-5.23.25-5.62-3.38,3.17-3.9,1.81-3-7.62,3.84-4.41,2.62-10.56-.94-4.78-6.55-5.45-6.9-.89,0,.3-2.6.51-3.33.51-.89,0,2.11-2.73,2.11-2.74A3.22,3.22,0,0,1,13.2,5.22Z" />
					</g>
				</svg>
			</div>

			<RepoSwitcher />
			<RepoNavigation />
			<AccountNavigation />
		</div>
	</div>

	<main class="content">
		<div class="container">
			<slot />
		</div>
	</main>
</div>
-->
