<script lang="ts">
	import Notebook from 'tabler-icons-svelte/icons/Notebook.svelte';
	import Lock from 'tabler-icons-svelte/icons/Lock.svelte';
	import Square1 from 'tabler-icons-svelte/icons/Square1.svelte';
	import Square2 from 'tabler-icons-svelte/icons/Square2.svelte';
	import Square3 from 'tabler-icons-svelte/icons/Square3.svelte';
	import User from 'tabler-icons-svelte/icons/User.svelte';
	import Archive from 'tabler-icons-svelte/icons/Archive.svelte';
	import InfoCircle from 'tabler-icons-svelte/icons/InfoCircle.svelte';
	import Button from 'src/app/components/kit/Button.svelte';
	import { Collaboration, CollaborationRole, Repository, RepositoryAccessType, RepositoryVersionScheme } from '@omaha/client';
	import { getContext, onDestroy } from 'svelte';
	import omaha from 'src/omaha';
	import { router } from 'tinro';

	export let repo: Repository;
	export let collab: Collaboration;

	let repoName = repo.name;
	let repoDescription = repo.description;
	let repoAccess: 'private' | 'public' = repo.access;
	let repoVersionScheme: 'semantic' | 'microsoft' | 'incremental' = repo.scheme;
	let repoRolling = repo.settings['releases.rolling'];
	let repoRollingBuffer = repo.settings['releases.rolling.buffer'];
	let repoArchiveExpiration = repo.settings['releases.archives.expiration'];

	const [client, error, loading, dispose] = omaha.client.useFromComponent();
	onDestroy(dispose);

	const { refreshRepository } = getContext('app');

	async function onSubmit() {
		try {
			await client.repos.update(repo.id, {
				name: repoName,
				description: repoDescription,
				access: repoAccess as RepositoryAccessType,
				scheme: repoVersionScheme as RepositoryVersionScheme,
				settings: {
					'releases.rolling': repoRolling,
					'releases.rolling.buffer': repoRollingBuffer,
					'releases.archives.expiration': repoArchiveExpiration
				}
			});

			await omaha.repositories.refresh();
			await refreshRepository();

			omaha.alerts.success('Changes saved successfully!', 3000);
		}
		catch (err) {
			window.scrollTo(0, 0);
		}
	}

	async function deleteRepo() {
		const message = `Are you sure you want to delete this repository? We'll send you an email with a link to ` +
			`revert this action. If you don't revert it within 7 days, the repository and all of its data will be ` +
			`permanently deleted.`;

		if (confirm(message)) {
			try {
				const response = await client.repos.delete(repo.id);
				await omaha.repositories.refresh();

				omaha.alerts.success(response.message, 3000);
				router.goto('/');
			}
			catch (err) {
				window.scrollTo(0, 0);
			}
		}
	}

	async function leaveRepo() {
		const message = `Are you sure you want to leave this repository? You won't be able to get access again ` +
			`without an invitation from another member.`;

		if (confirm(message)) {
			try {
				await client.collabs.delete(repo.id, collab.id);
				await omaha.repositories.refresh();

				omaha.alerts.success('You have left this repository.', 3000);
				router.goto('/');
			}
			catch (err) {
				window.scrollTo(0, 0);
			}
		}
	}
</script>

<div class="form-container">
	<form class="form" on:submit|preventDefault={ onSubmit }>
		<h1>Profile</h1>

		<!-- Basic repository information -->
		<div class="form-section">
			{#if $error}
				<div class="alert alert-danger mb-4" role="alert">
					{$error}
				</div>
			{/if}

			<div class="form-group">
				<label for="inputName">Repository name</label>
				<input type="text" class="form-control half" id="inputName" bind:value={repoName}>
			</div>
			<div class="form-group">
				<label for="inputDescription">Description <span class="tip">(optional)</span></label>
				<input type="text" class="form-control" id="inputDescription" bind:value={repoDescription}>
			</div>
		</div>

		<div class="form-section">
			<Button type="submit" color="blue" loading={$loading}>Save changes</Button>
		</div>

		<!-- Access level -->
		<h1 class="spacious">Access</h1>
		<div class="form-section">
			<div class="form-group">
				<div class="form-radio-list">
					<div class="form-radio-list-item">
						<div class="radio">
							<input
								type="radio"
								class="form-check-input"
								bind:group={repoAccess}
								name="access"
								value="public"
								id="inputAccessPublic"
							/>
						</div>
						<label for="inputAccessPublic">
							<div class="icon">
								<Notebook strokeWidth={1.5} />
							</div>
							<div class="details">
								<strong>Public</strong>
								<p>Anyone can access this repository if they know its unique identifier.</p>
							</div>
						</label>
					</div>
					<div class="form-radio-list-item">
						<div class="radio">
							<input
								type="radio"
								class="form-check-input"
								bind:group={repoAccess}
								name="access"
								value="private"
								id="inputAccessPrivate"
							/>
						</div>
						<label for="inputAccessPrivate">
							<div class="icon">
								<Lock strokeWidth={1.5} />
							</div>
							<div class="details">
								<strong>Private</strong>
								<p>Nobody can access this repository without an invitation or access token.</p>
							</div>
						</label>
					</div>
				</div>
			</div>
		</div>

		<div class="form-section">
			<Button type="submit" loading={$loading}>Save changes</Button>
		</div>

		<!-- Version scheme -->
		<h1 class="spacious">Versions</h1>
		<div class="form-section">
			<div class="form-group">
				<div class="form-radio-list">
					<div class="form-radio-list-item">
						<div class="radio">
							<input
								type="radio"
								class="form-check-input"
								bind:group={repoVersionScheme}
								name="driver"
								value="semantic"
								id="inputVersionSemantic"
							/>
						</div>
						<label for="inputVersionSemantic">
							<div class="icon">
								<Square1 strokeWidth={1.5} />
							</div>
							<div class="details">
								<strong>Semantic</strong>
								<p>Standard version format (1.2.3)</p>
							</div>
						</label>
					</div>
					<div class="form-radio-list-item">
						<div class="radio">
							<input
								type="radio"
								class="form-check-input"
								bind:group={repoVersionScheme}
								name="driver"
								value="microsoft"
								id="inputVersionMicrosoft"
							/>
						</div>
						<label for="inputVersionMicrosoft">
							<div class="icon">
								<Square2 strokeWidth={1.5} />
							</div>
							<div class="details">
								<strong>Microsoft</strong>
								<p>Semantic but with a build number (1.2.3.4)</p>
							</div>
						</label>
					</div>
					<div class="form-radio-list-item">
						<div class="radio">
							<input
								type="radio"
								class="form-check-input"
								bind:group={repoVersionScheme}
								name="driver"
								value="incremental"
								id="inputVersionIncremental"
							/>
						</div>
						<label for="inputVersionIncremental">
							<div class="icon">
								<Square3 strokeWidth={1.5} />
							</div>
							<div class="details">
								<strong>Incremental</strong>
								<p>Use your own format, but each release is a newer version</p>
							</div>
						</label>
					</div>
				</div>
			</div>
		</div>

		<div class="form-section">
			<Button type="submit" loading={$loading}>Save changes</Button>
		</div>

		<!-- Archive behavior -->
		<h1 class="spacious">Archiving</h1>
		<div class="form-section">
			<div class="form-group">
				<div class="form-radio-list">
					<div class="form-radio-list-item">
						<div class="radio">
							<input
								type="radio"
								class="form-check-input"
								bind:group={repoRolling}
								name="rolling"
								value={false}
								id="inputRollingDisabled"
							/>
						</div>
						<label for="inputRollingDisabled">
							<div class="icon">
								<User strokeWidth={1.5} />
							</div>
							<div class="details">
								<strong>Manual</strong>
								<p>Releases remain published until you archive them.</p>
							</div>
						</label>
					</div>
					<div class="form-radio-list-item">
						<div class="radio">
							<input
								type="radio"
								class="form-check-input"
								bind:group={repoRolling}
								name="rolling"
								value={true}
								id="inputRollingEnabled"
							/>
						</div>
						<label for="inputRollingEnabled">
							<div class="icon">
								<Archive strokeWidth={1.5} />
							</div>
							<div class="details">
								<strong>Rolling</strong>
								<p>Automatically archive old releases as you publish more.</p>
							</div>
						</label>
					</div>
				</div>
			</div>

			{#if repoRolling}
				<div class="form-group">
					<label for="inputBuffer">Number of releases to keep per major version</label>
					<input type="number" class="form-control half" id="inputBuffer" bind:value={repoRollingBuffer}>
				</div>
			{/if}

			<div class="form-group">
				<label for="inputExpiration">Number of days to preserve archived files</label>
				<input
					type="number"
					class="form-control half"
					id="inputExpiration"
					bind:value={repoArchiveExpiration}
					min={0}
					max={1461}
				/>
			</div>
		</div>

		{#if repoAccess !== repo.access}
		<div class="form-section info">
			<InfoCircle strokeWidth={2} />
			<p>
				You're changing this repository to <strong>{repoAccess}</strong> &ndash;
				{#if repoAccess === 'public'}
					anyone will be able to download your files.
				{:else}
					only people you invite will be able to download your files.
				{/if}
			</p>
		</div>
		{/if}

		<div class="form-section bottom">
			<Button type="submit" loading={$loading}>Save changes</Button>
		</div>
	</form>

	<h1 class="spacious">Danger zone</h1>
	<div class="form-section">
		<div class="form-card-container">
			<div class="form-card">
				<div class="details">
					<h3>Leave this repository</h3>
					<p>You won't have access to this repository any longer.</p>
				</div>
				<div class="action">
					<Button on:click={ leaveRepo } loading={$loading}>Leave</Button>
				</div>
			</div>

			{#if collab.role === CollaborationRole.Owner}
				<div class="form-card">
					<div class="details">
						<h3 class="text-danger">Delete this repository</h3>
						<p>You will be able to restore the repository within 7 days.</p>
					</div>
					<div class="action">
						<Button color="red" on:click={ deleteRepo } loading={$loading}>Delete</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
