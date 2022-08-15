<script lang="ts">
	import { Repository } from '@omaha/client';
	import { active } from 'tinro';

	export let repository: Repository;
</script>

<div class="repo-header">
	<div class="container">
		<nav class="repo-navigation">
			<ul>
				<li><a href="/repository/{repository.id}/releases" use:active={repository}>Releases</a></li>
				<li><a href="/repository/{repository.id}/assets" use:active={repository}>Assets</a></li>
				<li><a href="/repository/{repository.id}/tags" use:active={repository}>Tags</a></li>
				<li><a href="/repository/{repository.id}/stats" use:active={repository}>Stats</a></li>
				<li><a href="/repository/{repository.id}/settings" use:active={repository}>Settings</a></li>
			</ul>
		</nav>
	</div>
</div>
