<script lang="ts">
	import { dayjs } from './scripts/dayjs';
	import { onMount } from 'svelte';

	let interval: NodeJS.Timeout | undefined = undefined;
	let format = 'YYYY-MM-DD hh:mm A';
	let formatted = '';
	let relative = true;

	export let timestamp: Date | number | string;
	export let future = false;

	$: date = new Date(timestamp);

	onMount(() => {
		interval = setInterval(() => {
			if (date.getTime() >= Date.now() && !future) {
				formatted = 'just now';
				return;
			}

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

		relative = ago < 86400 && (future || ago >= 0);
	}

	$: {
		if (date.getTime() >= Date.now() && !future) {
			formatted = 'just now';
		}
		else {
			formatted = relative ? dayjs(timestamp).from(undefined) : dayjs(timestamp).format(format);
		}
	}

	$: title = date.toISOString();
</script>

<time {...$$restProps} {title} datetime={date.toISOString()}>
  {formatted}
</time>
