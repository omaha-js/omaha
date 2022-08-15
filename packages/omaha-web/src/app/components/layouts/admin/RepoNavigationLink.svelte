<script lang="ts">
	import { active } from 'tinro';

	export let swatch: number;
	export let title: string;
	export let href: string;
</script>

<li class="swatch-{swatch}" data-href={href} use:active class:disabled={true}>
	<a href={undefined} disabled={true}>
		<div class="section-link-container">
			<div class="sidebar-icon">
				<slot />
			</div>
			<div class="title">{title}</div>
		</div>
	</a>
</li>
