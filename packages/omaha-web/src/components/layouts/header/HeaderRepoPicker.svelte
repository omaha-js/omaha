<script lang="ts">
	import Notebook from 'tabler-icons-svelte/icons/Notebook.svelte';
	import ChevronDown from 'tabler-icons-svelte/icons/ChevronDown.svelte';
</script>

<div class="repo-picker">
	<div class="repo-picker-input">
		<div class="repo-icon">
			<Notebook size={28} strokeWidth={1.5} />
		</div>
		<div class="repo-name state-no-selection">
			Select a repository...
		</div>
		<div class="repo-caret">
			<ChevronDown size={28} strokeWidth={1.5} />
		</div>
	</div>
</div>
