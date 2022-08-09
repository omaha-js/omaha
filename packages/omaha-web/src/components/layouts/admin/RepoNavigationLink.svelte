<script lang="ts">
	import { repository } from 'src/omaha/stores/repository';
	import { active } from 'tinro';

	export let swatch: number;
	export let title: string;
	export let href: string;
</script>

<li class="swatch-{swatch}" data-href={href} use:active class:disabled={!$repository}>
	<a href={$repository ? href : undefined} disabled={!$repository}>
		<div class="section-link-container">
			<div class="sidebar-icon">
				<slot />
			</div>
			<div class="title">{title}</div>
		</div>
	</a>
</li>
