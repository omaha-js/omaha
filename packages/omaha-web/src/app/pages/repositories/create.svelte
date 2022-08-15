<script lang="ts">
	import Notebook from 'tabler-icons-svelte/icons/Notebook.svelte';
	import Lock from 'tabler-icons-svelte/icons/Lock.svelte';
	import Square1 from 'tabler-icons-svelte/icons/Square1.svelte';
	import Square2 from 'tabler-icons-svelte/icons/Square2.svelte';
	import Square3 from 'tabler-icons-svelte/icons/Square3.svelte';
	import User from 'tabler-icons-svelte/icons/User.svelte';
	import Archive from 'tabler-icons-svelte/icons/Archive.svelte';
	import InfoCircle from 'tabler-icons-svelte/icons/InfoCircle.svelte';

	let repoName: string;
	let repoDescription: string;
	let repoAccess: 'private' | 'public' = 'private';
	let repoVersionScheme: 'semantic' | 'microsoft' | 'incremental' = 'semantic';
	let repoRolling = false;
	let repoRollingBuffer = 10;
	let repoArchiveExpiration = 14;
</script>

<div class="form-container">
	<form class="form">
		<div class="heading-group">
			<h1>Create a new repository</h1>
			<p>
				A repository tracks all of the releases and files for a particular software project. You can customize each
				repository with its own version scheme, assets, and tags.
			</p>
		</div>

		<!-- Basic repository information -->
		<div class="form-section top">
			<div class="form-group">
				<label for="inputName">Repository name</label>
				<input type="text" class="form-control half" id="inputName">
			</div>
			<div class="form-group">
				<label for="inputDescription">Description <span class="tip">(optional)</span></label>
				<input type="text" class="form-control" id="inputDescription">
			</div>
		</div>

		<!-- Access level -->
		<div class="form-section">
			<div class="form-group">
				<div class="form-label">Access level</div>

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

		<!-- Version scheme -->
		<div class="form-section">
			<div class="form-group">
				<div class="form-label">Version scheme</div>

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

		<!-- Archive behavior -->
		<div class="form-section">
			<div class="form-group">
				<div class="form-label">Archive behavior</div>

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
					<input type="number" class="form-control half" id="inputBuffer" value={repoRollingBuffer}>
				</div>
			{/if}

			<div class="form-group">
				<label for="inputExpiration">Number of days to preserve archived files</label>
				<input
					type="number"
					class="form-control half"
					id="inputExpiration"
					value={repoArchiveExpiration}
					min={0}
					max={1461}
				/>
			</div>
		</div>

		<div class="form-section info">
			<InfoCircle strokeWidth={2} />
			<p>
				You're creating a <strong>{repoAccess}</strong> repository &ndash;
				{#if repoAccess === 'public'}
					anyone will be able to download your files.
				{:else}
					only people you invite will be able to download your files.
				{/if}
			</p>
		</div>

		<div class="form-section bottom">
			<button type="submit" class="btn btn-blue">Create repository</button>
		</div>
	</form>
</div>
