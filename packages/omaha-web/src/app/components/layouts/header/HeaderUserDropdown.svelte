<script lang="ts">
	import md5 from 'blueimp-md5';
	import omaha from 'src/omaha';

	const { account } = omaha.session;

	let avatarURL = '';

	$: {
		let hash = md5($account!.email.trim().toLowerCase());
		avatarURL = `https://www.gravatar.com/avatar/${hash}?d=mp&r=g&s=100`;
	}
</script>

<div class="header-user">
	<div class="avatar">
		<img src={avatarURL} alt={$account?.name} />
	</div>
</div>
