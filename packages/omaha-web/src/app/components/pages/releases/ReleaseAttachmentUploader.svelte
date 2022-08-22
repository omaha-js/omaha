<script lang="ts">
	import { Repository } from '@omaha/client';
	import omaha from 'src/omaha';
	import { createEventDispatcher, onDestroy } from 'svelte';

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	export let repo: Repository;
	export let version: string;
	export let asset: string;
	export let editable: boolean;
	export let empty: boolean;

	let dropzone = false;
	let uploading = false;
	let errorText = '';

	const dispatch = createEventDispatcher();

	export function selectFile(event: MouseEvent) {
		event.stopPropagation();

		if (!editable || uploading) return;

		const input = document.createElement('input');
		input.type = 'file';

		input.onchange = async () => {
			if (input.files && input.files.length === 1) {
				const file = input.files[0];
				uploading = true;
				errorText = '';

				try {
					await client.attachments.upload(repo.id, version, asset, {
						content: file
					});

					uploading = false;
					dispatch('uploaded');
				}
				catch (error) {
					uploading = false;

					if (error instanceof Error) {
						errorText = error.message;
					}
					else {
						errorText = 'Unknown error';
					}
				}
			}
		};

		input.click();
	}

	function onClick(event: MouseEvent) {
		if (editable && empty) {
			selectFile(event);
		}
		else {
			dispatch('click');
		}
	}
</script>

<tr {...$$restProps} class:dropzone on:click={ onClick }>
	<slot {selectFile} {dropzone} {uploading} {errorText} />
</tr>
