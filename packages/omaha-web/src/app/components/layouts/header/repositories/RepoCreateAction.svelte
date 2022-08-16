<script lang="ts">
	import { router } from 'tinro';
	import { registerAction } from '../scripts/repo-actions';

	export let href: string;
	export let title: string | undefined = undefined;

	$: {
		registerAction($router.path, {
			name: 'create',
			href,
			title
		});
	}
</script>
