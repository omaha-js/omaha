<script lang="ts">
	import md5 from 'blueimp-md5';

	export let email: string;
	export let alt: string;
	export let size: number;

	let avatarURL = '';

	$: {
		let hash = md5(email.trim().toLowerCase());
		avatarURL = `https://www.gravatar.com/avatar/${hash}?d=mp&r=g&s=${size}`;
	}
</script>

<img src={avatarURL} {alt} {...$$restProps} />
