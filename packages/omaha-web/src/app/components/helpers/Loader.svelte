<script lang="ts">
	/**
	 * The diameter of the spinner in pixels.
	 */
	export let size: number;

	/**
	 * Whether or not this loader will fill the entire window (position fixed) with a high z-index.
	 */
	export let full: boolean = false;

	/**
	 * The duration for the animation (in css format) such as `0.5s`.
	 */
	export let duration: string = '0.5s';

	/**
	 * The color to use for the spinner. Will be overridden by themes.
	 */
	export let color: string | undefined = 'currentColor';

	/**
	 * The theme to use for color presets (defaults to none).
	 */
	export let theme: Theme = 'none';

	/**
	 * The message to display next to the spinner.
	 */
	export let message = '';

	type Theme = 'none' | 'gray' ;
</script>

<div class="loader theme-{theme}" class:full>
	<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width={size} height={size} viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">
		<path fill={color} d="M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z">
		<animateTransform attributeType="xml"
			attributeName="transform"
			type="rotate"
			from="0 25 25"
			to="360 25 25"
			dur={duration}
			repeatCount="indefinite"/>
		</path>
	</svg>
	{#if message}
	<div class="status">
		{message}
	</div>
	{/if}
</div>
