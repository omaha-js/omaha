<script lang="ts">
	import { dayjs } from './scripts/dayjs';
	import { onMount } from 'svelte';

	let interval: NodeJS.Timeout | undefined = undefined;
	let format = 'YYYY-MM-DD HH:mm A';
	let relative = true;

	export let timestamp: Date | number | string;

	$: date = new Date(timestamp).toISOString();

	onMount(() => {
		interval = setInterval(() => {
			formatted = relative ? dayjs(timestamp).from(undefined) : dayjs(timestamp).format(format);
		}, 60000);

		return () => {
			if (typeof interval !== 'undefined') {
				clearInterval(interval);
			}
		};
	});

	$: {
		const time = new Date(timestamp).getTime();
		const ago = (Date.now() - time) / 1000;

		relative = ago < 86400;
	}

	$: formatted = relative ? dayjs(timestamp).from(undefined) : dayjs(timestamp).format(format);
	$: title = date;
</script>

<time {...$$restProps} {title} datetime={date}>
  {formatted}
</time>
