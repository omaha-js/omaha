<script lang="ts">
	import { CollaborationRole, Scope, ScopeDescriptor, ScopesResponse } from '@omaha/client';

	type T = $$Generic<Scope>;

	/**
	 * The list of selected scopes as string IDs.
	 */
	export let selected: T[];

	/**
	 * The full list of available scopes from the API.
	 */
	export let available: ScopesResponse;

	/**
	 * The role to infer scopes from. When provided and not set to 'custom', the checkboxes will be disabled.
	 */
	export let role: CollaborationRole | undefined = undefined;

	/**
	 * Restrict only to repository scopes?
	 */
	export let repo = false;

	let preview: Scope[];

	$: scopesList = available.scopes.filter(row => !repo || row.type === 'repo');
	$: editable = !role || role === CollaborationRole.Custom;
	$: {
		if (!editable && role) {
			preview = scopesList
				.filter(scope => scope.type === 'repo' && scope.groups.includes(role))
				.map(scope => scope.id);
		}
	}

	$: scopesForRepo = scopesList.filter(scope => scope.id.startsWith('repo.'));
	$: scopesForAccount = scopesList.filter(scope => scope.id.startsWith('account.'));

	function areAllEnabled(selected: string[], scopes: ScopeDescriptor[]) {
		for (const {id} of scopes) {
			if (!selected.includes(id as T)) {
				return false;
			}
		}

		return true;
	}

	$: allForAccount = areAllEnabled(!editable && role ? preview : selected, scopesForAccount);
	$: allForRepo = areAllEnabled(!editable && role ? preview : selected, scopesForRepo);

	function onBigCheckChanged(event: Event & { currentTarget: HTMLInputElement }, scopes: ScopeDescriptor[]) {
		if (event.currentTarget.checked) {
			for (const {id} of scopes) {
				if (!selected.includes(id as T)) {
					selected.push(id as T);
				}
			}

			selected = selected;
		}
		else {
			const ids = scopes.map(scope => scope.id);
			selected = selected.filter(id => !ids.includes(id));
		}
	}
</script>

<div class="scope-picker">
	<table>
		<tbody>
			{#if scopesForAccount.length > 0}
				<tr class="scope-picker-header">
					<td>
						<label for="scope_all_account" class:disabled={!editable}>
							{#if editable}
								<input
									type="checkbox"
									class="form-check-input"
									id="scope_all_account"
									checked={allForAccount}
									on:change={e=>onBigCheckChanged(e, scopesForAccount)}
								/>
							{:else}
								<input type="checkbox" class="form-check-input" checked={allForAccount} disabled />
							{/if}
						</label>
					</td>
					<td colspan="2">
						<label for="scope_all_account" class:disabled={!editable}>
							account
						</label>
					</td>
				</tr>

				{#each scopesForAccount as scope, index}
					<tr class="scope-row" class:first={index === 0} class:last={index === scopesForAccount.length - 1}>
						<td class="scope-checkbox">
							<label for="scope_{scope.id}" class:disabled={!editable}>
								{#if editable}
									<input type="checkbox" class="form-check-input" bind:group={selected} value={scope.id} id="scope_{scope.id}" />
								{:else}
									<input type="checkbox" class="form-check-input" bind:group={preview} value={scope.id} disabled />
								{/if}
							</label>
						</td>
						<td class="scope-id">
							<label for="scope_{scope.id}" class:disabled={!editable}>
								{scope.id.substring(8)}
							</label>
						</td>
						<td class="scope-description">
							<label for="scope_{scope.id}" class:disabled={!editable}>
								{scope.description}
							</label>
						</td>
					</tr>
				{/each}
			{/if}
			{#if scopesForRepo.length > 0}
				<tr class="scope-picker-header">
					<td>
						<label for="scope_all_repo" class:disabled={!editable}>
							{#if editable}
								<input
									type="checkbox"
									class="form-check-input"
									id="scope_all_repo"
									checked={allForRepo}
									on:change={e=>onBigCheckChanged(e, scopesForRepo)}
								/>
							{:else}
								<input type="checkbox" class="form-check-input" checked={allForRepo} disabled />
							{/if}
						</label>
					</td>
					<td colspan="2">
						<label for="scope_all_repo" class:disabled={!editable}>
							repositories
						</label>
					</td>
				</tr>

				{#each scopesForRepo as scope, index}
					<tr class="scope-row" class:first={index === 0} class:last={index === scopesForRepo.length - 1}>
						<td class="scope-checkbox">
							<label for="scope_{scope.id}" class:disabled={!editable}>
								{#if editable}
									<input type="checkbox" class="form-check-input" bind:group={selected} value={scope.id} id="scope_{scope.id}" />
								{:else}
									<input type="checkbox" class="form-check-input" bind:group={preview} value={scope.id} disabled />
								{/if}
							</label>
						</td>
						<td class="scope-id">
							<label for="scope_{scope.id}" class:disabled={!editable}>
								{scope.id.substring(5)}
							</label>
						</td>
						<td class="scope-description">
							<label for="scope_{scope.id}" class:disabled={!editable}>
								{scope.description}
							</label>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style lang="scss">
	// .scope-picker {
	// 	.scope {
	// 		label {
	// 			display: flex;
	// 			align-items: center;
	// 			padding: 0.6rem 0;
	// 			margin: 0;

	// 			input {
	// 				margin: 0 1rem 0 0;
	// 			}
	// 		}
	// 	}
	// }
</style>
