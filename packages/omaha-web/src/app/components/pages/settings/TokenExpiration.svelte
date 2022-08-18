<script lang="ts">
	export let value: number;
</script>

<div class="token-expiration-input">
	<select class="form-select" bind:value>
		<option value={7}>7 days</option>
		<option value={30}>30 days</option>
		<option value={60}>60 days</option>
		<option value={90}>90 days</option>
		<option value={0}>No expiration</option>
	</select>
</div>

<style lang="scss">
	.token-expiration-input {
		display: flex;
		align-items: center;
	}

	.form-select {
		max-width: 15rem;
	}
</style>
