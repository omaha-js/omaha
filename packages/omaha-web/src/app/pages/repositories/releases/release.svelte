<script lang="ts">
	import { Repository } from '@omaha/client';
	import { onDestroy } from 'svelte';
	import omaha from 'src/omaha';
	import { meta, router } from 'tinro';
	import PromiseLoader from 'src/app/components/helpers/PromiseLoader.svelte';
	import DotsVertical from 'tabler-icons-svelte/icons/DotsVertical.svelte';
	import ArrowDownCircle from 'tabler-icons-svelte/icons/ArrowDownCircle.svelte';
	import File from 'tabler-icons-svelte/icons/File.svelte';
	import FileOff from 'tabler-icons-svelte/icons/FileOff.svelte';
	import Pencil from 'tabler-icons-svelte/icons/Pencil.svelte';
	import Trash from 'tabler-icons-svelte/icons/Trash.svelte';
	import CircleCheck from 'tabler-icons-svelte/icons/CircleCheck.svelte';
	import Archive from 'tabler-icons-svelte/icons/Archive.svelte';
	import Time from 'src/app/components/helpers/Time.svelte';
	import { ReleaseStatus } from '@omaha/client';
	import prettyBytes from 'pretty-bytes';
	import { ButtonDropdown, DropdownItem, DropdownMenu } from 'sveltestrap';
	import ReleaseAttachmentUploader from 'src/app/components/pages/releases/ReleaseAttachmentUploader.svelte';
	import Loader from 'src/app/components/helpers/Loader.svelte';
	import DropdownToggle from 'src/app/components/kit/DropdownToggle.svelte';
	import RepoAction from 'src/app/components/layouts/header/repositories/RepoAction.svelte';
	import RepoActionContainer from 'src/app/components/layouts/header/repositories/RepoActionContainer.svelte';

	export let repo: Repository;

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	const route = meta();
	const assets = repo.assets!;
	let promise = getRelease();

	function getRelease() {
		return client.releases.get(repo.id, route.params.version).then(release => {
			return {
				...release,
				attachments: assets.map(asset => {
					return {
						...asset,
						attachment: release.attachments!.find(attachment => attachment.asset === asset.name)
					}
				}).filter(asset => {
					return !!asset.attachment || release.status === ReleaseStatus.Draft;
				})
			}
		});
	}

	function refresh() {
		promise = getRelease();
	}

	async function deleteAttachment(event: MouseEvent, asset: string) {
		event.stopPropagation();

		if (confirm('Are you sure you want to delete this attachment? This action is immediate and cannot be undone.')) {
			try {
				const response = await client.attachments.delete(repo.id, route.params.version, asset);
				omaha.alerts.success(response.message, 3500);
				refresh();
			}
			catch (error) {
				omaha.alerts.error(error);
			}
		}
	}

	async function downloadAttachment(event: MouseEvent, asset: string) {
		try {
			event.stopPropagation();
			const response = await client.attachments.download(repo.id, route.params.version, asset);
			omaha.alerts.success(`Starting download for ${response.file_name}...`);
			window.location.href = response.download_url;
		}
		catch (error) {
			omaha.alerts.error(error);
		}
	}

	let expandedAsset = '';

	function expand(event: MouseEvent, asset: string) {
		if (expandedAsset === asset) {
			expandedAsset = '';
		}
		else {
			expandedAsset = asset;
		}
	}

	async function deleteRelease() {
		if (confirm(`You're about to delete this release. Are you sure? This cannot be undone!`)) {
			try {
				const response = await client.releases.delete(repo.id, route.params.version);
				omaha.alerts.success(response.message, 3500);
				router.goto(`/repository/${repo.id}/releases`);
			}
			catch (error) {
				omaha.alerts.error(error);
			}
		}
	}

	async function publishRelease() {
		try {
			await client.releases.publish(repo.id, route.params.version);
			omaha.alerts.success('Release published successfully!', 3500);
			refresh();
		}
		catch (error) {
			omaha.alerts.error(error);
		}
	}

	async function archiveRelease() {
		if (confirm('Are you sure you want to archive this release? Attached files will be scheduled for deletion and cannot be downloaded further.')) {
			try {
				await client.releases.archive(repo.id, route.params.version);
				omaha.alerts.success('Release archived successfully!', 3500);
				refresh();
			}
			catch (error) {
				omaha.alerts.error(error);
			}
		}
	}
</script>

<PromiseLoader {promise} let:value={release}>
	<RepoActionContainer>
		{#if release.status === ReleaseStatus.Draft}
			<RepoAction key="delete" on:click={ deleteRelease } title="Delete this release">
				<Trash slot="icon" />
			</RepoAction>
		{/if}

		<RepoAction key="edit" href="/repository/{repo.id}/releases/{release.version}/edit" title="Edit this release">
			<Pencil slot="icon" />
		</RepoAction>

		{#if release.status === ReleaseStatus.Draft}
			<RepoAction key="p" on:click={ publishRelease } title="Publish this release" text="Publish" color="blue">
				<CircleCheck slot="icon" />
			</RepoAction>
		{:else if release.status === ReleaseStatus.Published}
			<RepoAction key="p" on:click={ archiveRelease } title="Archive this release" text="Archive">
				<Archive slot="icon" />
			</RepoAction>
		{/if}
	</RepoActionContainer>

	<div class="row release">
		<div class="col-md-9">
			<div class="heading-with-tags">
				<h1>{release.version}</h1>
				<div class="tags">
					{#each release.tags ?? [] as tag}
						<div class="attribute tag">
							{tag}
						</div>
					{/each}
				</div>
			</div>

			<table class="table themed mb-4">
				<thead>
					<tr>
						<th scope="col"></th>
						<th scope="col">Asset</th>
						<th scope="col">Name</th>
						<th scope="col">Size</th>
						<th scope="col">Date</th>
						{#if release.status !== ReleaseStatus.Draft}
							<th scope="col">Downloads</th>
						{/if}
						<th scope="col"></th>
					</tr>
				</thead>
				<tbody>
					{#each release.attachments as asset}
						<ReleaseAttachmentUploader
							editable={release.status === ReleaseStatus.Draft}
							let:selectFile
							let:dropzone
							let:errorText
							let:uploading
							{repo}
							asset={asset.name}
							version={release.version}
							class={"clickable " + (!!asset.attachment && expandedAsset === asset.name ? "has-nested" : "")}
							on:uploaded={ refresh }
							on:click={ e => expand(e, asset.name) }
						>
							<td class="attachment-icon" class:active={!!asset.attachment}>
								{#if asset.attachment || release.status !== ReleaseStatus.Draft}
									<File />
								{:else}
									<FileOff />
								{/if}
							</td>
							<td title={asset.description}>
								<div class="attribute tag">{asset.name}</div>
								{#if asset.required && release.status === ReleaseStatus.Draft}
									<span class="required">*</span>
								{/if}
							</td>
							{#if uploading}
								<td colspan="3" class="status-uploading">
									<div class="status-progress">
										<Loader rem size={2.2} />
										<div>Uploading file...</div>
									</div>
								</td>
							{:else if dropzone}
								<td colspan="3" class="status-dropzone">
									Drop file here to upload.
								</td>
							{:else if errorText}
								<td colspan="3" class="status-error" on:click={ selectFile }>
									{errorText}
								</td>
							{:else if asset.attachment}
								<td>{asset.attachment.file_name}</td>
								<td>{prettyBytes(asset.attachment.size)}</td>
								<td><Time timestamp={asset.attachment.updated_at} /></td>
								{#if release.status !== ReleaseStatus.Draft}
									<td>
										<div class="download-count">
											<div class="download-count-flex">
												<strong>{release.download_count}</strong>
												<ArrowDownCircle />
											</div>
										</div>
									</td>
								{/if}
							{:else if release.status === ReleaseStatus.Draft}
								<td
									colspan={release.status !== ReleaseStatus.Draft ? 4 : 3}
									class="upload-file"
									on:click={ selectFile }
								>
									Click to select a file...
								</td>
							{/if}
							<td class="dropdown-column">
								<ButtonDropdown class="dropdown">
									<DropdownToggle>
										<DotsVertical />
									</DropdownToggle>
									<DropdownMenu end={true}>
										{#if release.status === ReleaseStatus.Draft}
											<DropdownItem on:click={ selectFile }>Select file</DropdownItem>
										{/if}

										{#if asset.attachment}
											<DropdownItem on:click={ e => downloadAttachment(e, asset.name) }>Download</DropdownItem>
										{/if}

										{#if asset.attachment && release.status === ReleaseStatus.Draft}
											<DropdownItem on:click={ e => deleteAttachment(e, asset.name) } class="danger">
												Delete
											</DropdownItem>
										{/if}
									</DropdownMenu>
								</ButtonDropdown>
							</td>
						</ReleaseAttachmentUploader>

						{#if asset.attachment && expandedAsset === asset.name}
						<tr class="nested">
							<td colspan={release.status !== ReleaseStatus.Draft ? 7 : 6}>
								<table class="table mb-0">
									<tr>
										<td>
											<div class="attachment-details">
												<strong>sha1</strong>
												<p>{asset.attachment.hash_sha1}</p>
											</div>
										</td>
										<td>
											<div class="attachment-details">
												<strong>md5</strong>
												<p>{asset.attachment.hash_md5}</p>
											</div>
										</td>
										<td>
											<div class="attachment-details">
												<strong>size</strong>
												<p>{asset.attachment.size}</p>
											</div>
										</td>
									</tr>
								</table>
							</td>
						</tr>
						{/if}
					{/each}
				</tbody>
			</table>

			<div class="panel panel-cozy">
				<div class="panel-header">
					Description
				</div>
				<div class="panel-body padded">
					{#if release.description}
						{release.description}
					{:else}
						No description.
					{/if}
				</div>
			</div>
		</div>
		<div class="col-md-3">
			<h1>Information</h1>

			<div class="release-info">
				<div class="release-info-row">
					<h3>status</h3>
					<p>{release.status}</p>
				</div>
				<div class="release-info-row">
					<h3>downloads</h3>
					<p>{release.download_count}</p>
				</div>
				<div class="release-info-row">
					<h3>created at</h3>
					<p><Time timestamp={release.created_at} /></p>
				</div>
				{#if release.status !== ReleaseStatus.Draft && release.published_at}
					<div class="release-info-row">
						<h3>published at</h3>
						<p><Time timestamp={release.published_at} /></p>
					</div>
				{/if}
				{#if release.status === ReleaseStatus.Archived && release.archived_at}
					<div class="release-info-row">
						<h3>archived at</h3>
						<p><Time timestamp={release.archived_at} /></p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</PromiseLoader>
