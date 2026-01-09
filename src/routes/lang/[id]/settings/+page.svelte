<script lang="ts">
	import { Card, Button, Input, Textarea, Select, Checkbox, Modal, Alert } from '$lib/components/ui';
	import { currentLanguage } from '$lib/stores';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { runMutation, runQuery, getUserId, isAuthenticated } from '$lib/convex';
	import { onMount } from 'svelte';

	interface Collaborator {
		_id: string;
		userId: string;
		role: 'editor' | 'viewer';
		user: {
			displayName: string;
			handle: string;
			avatarUrl?: string;
		} | null;
	}

	const languageId = $derived($page.params.id);
	const canEdit = $derived($currentLanguage?.access?.canWrite ?? false);
	const isOwner = $derived($currentLanguage?.access?.isOwner ?? false);

	let saving = $state(false);
	let deleting = $state(false);
	let error = $state('');
	let success = $state('');
	let deleteModalOpen = $state(false);
	let deleteConfirmation = $state('');
	let collaboratorModalOpen = $state(false);
	let collaborators = $state<Collaborator[]>([]);
	let loadingCollaborators = $state(true);

	// Form state
	let form = $state({
		name: '',
		nativeName: '',
		description: '',
		isoCode: '',
		isPublic: false,
		wordOrder: '',
		headDirection: '',
		morphologicalType: '',
		alignment: '',
		stressPattern: ''
	});

	// Collaborator form
	let collaboratorForm = $state({
		handle: '',
		role: 'viewer' as 'editor' | 'viewer'
	});
	let addingCollaborator = $state(false);

	const wordOrders = [
		{ value: '', label: 'Not specified' },
		{ value: 'SOV', label: 'SOV (Subject-Object-Verb)' },
		{ value: 'SVO', label: 'SVO (Subject-Verb-Object)' },
		{ value: 'VSO', label: 'VSO (Verb-Subject-Object)' },
		{ value: 'VOS', label: 'VOS (Verb-Object-Subject)' },
		{ value: 'OVS', label: 'OVS (Object-Verb-Subject)' },
		{ value: 'OSV', label: 'OSV (Object-Subject-Verb)' },
		{ value: 'free', label: 'Free word order' }
	];

	const headDirections = [
		{ value: '', label: 'Not specified' },
		{ value: 'head-initial', label: 'Head-initial' },
		{ value: 'head-final', label: 'Head-final' },
		{ value: 'mixed', label: 'Mixed' }
	];

	const morphologicalTypes = [
		{ value: '', label: 'Not specified' },
		{ value: 'isolating', label: 'Isolating (analytic)' },
		{ value: 'agglutinative', label: 'Agglutinative' },
		{ value: 'fusional', label: 'Fusional (inflecting)' },
		{ value: 'polysynthetic', label: 'Polysynthetic' },
		{ value: 'oligosynthetic', label: 'Oligosynthetic' }
	];

	const alignments = [
		{ value: '', label: 'Not specified' },
		{ value: 'nominative-accusative', label: 'Nominative-Accusative' },
		{ value: 'ergative-absolutive', label: 'Ergative-Absolutive' },
		{ value: 'split-ergative', label: 'Split Ergative' },
		{ value: 'tripartite', label: 'Tripartite' },
		{ value: 'active-stative', label: 'Active-Stative' },
		{ value: 'fluid-s', label: 'Fluid-S' },
		{ value: 'direct', label: 'Direct (neutral)' }
	];

	const stressPatterns = [
		{ value: '', label: 'Not specified' },
		{ value: 'initial', label: 'Initial (first syllable)' },
		{ value: 'final', label: 'Final (last syllable)' },
		{ value: 'penultimate', label: 'Penultimate (second-to-last)' },
		{ value: 'antepenultimate', label: 'Antepenultimate (third-to-last)' },
		{ value: 'fixed', label: 'Fixed (other)' },
		{ value: 'weight-sensitive', label: 'Weight-sensitive' },
		{ value: 'lexical', label: 'Lexical (unpredictable)' },
		{ value: 'none', label: 'No stress' }
	];

	onMount(() => {
		if ($currentLanguage) {
			initForm();
		}
		loadCollaborators();
	});

	$effect(() => {
		if ($currentLanguage) {
			initForm();
		}
	});

	function initForm() {
		if (!$currentLanguage) return;
		form = {
			name: $currentLanguage.name ?? '',
			nativeName: $currentLanguage.nativeName ?? '',
			description: $currentLanguage.description ?? '',
			isoCode: $currentLanguage.isoCode ?? '',
			isPublic: $currentLanguage.isPublic ?? false,
			wordOrder: ($currentLanguage.settings?.wordOrder as string) ?? '',
			headDirection: ($currentLanguage.settings?.headDirection as string) ?? '',
			morphologicalType: ($currentLanguage.settings?.morphologicalType as string) ?? '',
			alignment: ($currentLanguage.settings?.alignment as string) ?? '',
			stressPattern: ($currentLanguage.settings?.stressPattern as string) ?? ''
		};
	}

	async function loadCollaborators() {
		if (!$isAuthenticated) return;
		try {
			const result = await runQuery<Collaborator[]>('languages:getCollaborators', {
				languageId,
				userId: getUserId()
			});
			collaborators = result ?? [];
		} catch (e) {
			console.error('Failed to load collaborators:', e);
		} finally {
			loadingCollaborators = false;
		}
	}

	async function saveSettings() {
		if (!canEdit) return;
		
		saving = true;
		error = '';
		success = '';

		try {
			await runMutation('languages:updateLanguage', {
				languageId,
				userId: getUserId()!,
				name: form.name,
				nativeName: form.nativeName || undefined,
				description: form.description || undefined,
				isoCode: form.isoCode || undefined,
				isPublic: form.isPublic,
				settings: {
					wordOrder: form.wordOrder || undefined,
					headDirection: form.headDirection || undefined,
					morphologicalType: form.morphologicalType || undefined,
					alignment: form.alignment || undefined,
					stressPattern: form.stressPattern || undefined
				}
			});
			
			success = 'Settings saved successfully';
			await currentLanguage.load(languageId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save settings';
		} finally {
			saving = false;
		}
	}

	async function deleteLanguage() {
		if (!isOwner || deleteConfirmation !== $currentLanguage?.name) return;
		
		deleting = true;
		error = '';

		try {
			await runMutation('languages:deleteLanguage', {
				languageId,
				userId: getUserId()!
			});
			goto('/languages');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete language';
			deleting = false;
		}
	}

	async function addCollaborator() {
		if (!isOwner || !collaboratorForm.handle) return;

		addingCollaborator = true;
		error = '';

		try {
			await runMutation('languages:addCollaborator', {
				languageId,
				ownerId: getUserId()!,
				userHandle: collaboratorForm.handle,
				role: collaboratorForm.role
			});
			
			collaboratorForm = { handle: '', role: 'viewer' };
			collaboratorModalOpen = false;
			await loadCollaborators();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add collaborator';
		} finally {
			addingCollaborator = false;
		}
	}

	async function removeCollaborator(userId: string) {
		if (!isOwner) return;

		try {
			await runMutation('languages:removeCollaborator', {
				languageId,
				ownerId: getUserId()!,
				userId
			});
			await loadCollaborators();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove collaborator';
		}
	}
</script>

<svelte:head>
	<title>Settings - {$currentLanguage?.name ?? 'Language'} | Conlanger</title>
</svelte:head>

<div class="settings-page">
	{#if !$currentLanguage}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading settings...</p>
		</div>
	{:else if !canEdit}
		<Alert type="warning" message="You don't have permission to edit this language's settings." />
	{:else}
		<h1>Language Settings</h1>

		{#if error}
			<Alert type="error" dismissible ondismiss={() => error = ''} message={error} />
		{/if}

		{#if success}
			<Alert type="success" dismissible ondismiss={() => success = ''} message={success} />
		{/if}

		<section class="settings-section">
			<Card title="Basic Information">
				<div class="form">
					<div class="form-row">
						<div class="form-group">
							<label for="name">Language Name *</label>
							<Input id="name" bind:value={form.name} placeholder="e.g. Elvish" />
						</div>
						<div class="form-group">
							<label for="nativeName">Native Name</label>
							<Input id="nativeName" bind:value={form.nativeName} placeholder="e.g. Quenya" />
						</div>
					</div>

					<div class="form-group">
						<label for="description">Description</label>
						<Textarea 
							id="description" 
							bind:value={form.description} 
							placeholder="Describe your language..."
							rows={4}
						/>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="isoCode">ISO Code (optional)</label>
							<Input id="isoCode" bind:value={form.isoCode} placeholder="e.g. qya" maxlength={3} />
						</div>
						<div class="form-group checkbox-wrapper">
							<Checkbox bind:checked={form.isPublic} label="Public language" />
							<span class="form-hint">Public languages can be viewed by anyone</span>
						</div>
					</div>
				</div>
			</Card>
		</section>

		<section class="settings-section">
			<Card title="Typological Settings">
				<div class="form">
					<div class="form-row">
						<div class="form-group">
							<label for="wordOrder">Word Order</label>
							<Select id="wordOrder" options={wordOrders} bind:value={form.wordOrder} />
						</div>
						<div class="form-group">
							<label for="headDirection">Head Direction</label>
							<Select id="headDirection" options={headDirections} bind:value={form.headDirection} />
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="morphologicalType">Morphological Type</label>
							<Select id="morphologicalType" options={morphologicalTypes} bind:value={form.morphologicalType} />
						</div>
						<div class="form-group">
							<label for="alignment">Morphosyntactic Alignment</label>
							<Select id="alignment" options={alignments} bind:value={form.alignment} />
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="stressPattern">Stress Pattern</label>
							<Select id="stressPattern" options={stressPatterns} bind:value={form.stressPattern} />
						</div>
					</div>
				</div>
			</Card>
		</section>

		<section class="settings-section">
			<div class="section-actions">
				<Button variant="primary" onclick={saveSettings} loading={saving} disabled={!form.name}>
					Save Settings
				</Button>
			</div>
		</section>

		{#if isOwner}
			<section class="settings-section">
				<Card title="Collaborators">
					<p class="section-description">
						Invite others to view or edit your language. Editors can make changes, viewers can only read.
					</p>

					{#if loadingCollaborators}
						<p class="loading-text">Loading collaborators...</p>
					{:else if collaborators.length === 0}
						<p class="empty-text">No collaborators yet.</p>
					{:else}
						<div class="collaborator-list">
							{#each collaborators as collab}
								<div class="collaborator-item">
									<div class="collaborator-info">
										{#if collab.user?.avatarUrl}
											<img src={collab.user.avatarUrl} alt="" class="collaborator-avatar" />
										{:else}
											<div class="collaborator-avatar placeholder">
												{collab.user?.displayName?.charAt(0) ?? '?'}
											</div>
										{/if}
										<div class="collaborator-details">
											<span class="collaborator-name">{collab.user?.displayName ?? 'Unknown'}</span>
											<span class="collaborator-handle">@{collab.user?.handle ?? 'unknown'}</span>
										</div>
									</div>
									<div class="collaborator-actions">
										<span class="collaborator-role">{collab.role}</span>
										<Button 
											size="sm" 
											variant="ghost" 
											onclick={() => removeCollaborator(collab.userId)}
										>
											Remove
										</Button>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class="add-collaborator-action">
						<Button variant="secondary" onclick={() => collaboratorModalOpen = true}>
							Add Collaborator
						</Button>
					</div>
				</Card>
			</section>

			<section class="settings-section danger-zone">
				<Card title="Danger Zone">
					<p class="danger-description">
						Deleting your language will permanently remove all associated data including phonemes, 
						words, morphemes, scripts, and texts. This action cannot be undone.
					</p>
					<Button variant="danger" onclick={() => deleteModalOpen = true}>
						Delete Language
					</Button>
				</Card>
			</section>
		{/if}
	{/if}
</div>

<Modal 
	bind:open={collaboratorModalOpen} 
	title="Add Collaborator"
	size="sm"
	onclose={() => collaboratorModalOpen = false}
>
	<div class="form">
		<div class="form-group">
			<label for="collab-handle">User Handle</label>
			<Input 
				id="collab-handle" 
				bind:value={collaboratorForm.handle} 
				placeholder="@username" 
			/>
		</div>
		<div class="form-group">
			<label for="collab-role">Role</label>
			<Select 
				id="collab-role"
				options={[
					{ value: 'viewer', label: 'Viewer (read only)' },
					{ value: 'editor', label: 'Editor (can make changes)' }
				]}
				bind:value={collaboratorForm.role}
			/>
		</div>
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => collaboratorModalOpen = false}>Cancel</Button>
		<Button 
			variant="primary" 
			onclick={addCollaborator} 
			loading={addingCollaborator}
			disabled={!collaboratorForm.handle}
		>
			Add
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={deleteModalOpen} 
	title="Delete Language"
	size="sm"
	onclose={() => deleteModalOpen = false}
>
	<div class="delete-warning">
		<p>Are you sure you want to delete <strong>{$currentLanguage?.name}</strong>?</p>
		<p>This will permanently delete:</p>
		<ul>
			<li>All phonemes and sound changes</li>
			<li>All words in the lexicon</li>
			<li>All morphemes and grammar categories</li>
			<li>All scripts and writing systems</li>
			<li>All texts and translations</li>
		</ul>
		<p>Type <strong>{$currentLanguage?.name}</strong> to confirm:</p>
		<Input bind:value={deleteConfirmation} placeholder="Type language name..." />
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => deleteModalOpen = false}>Cancel</Button>
		<Button 
			variant="danger" 
			onclick={deleteLanguage}
			loading={deleting}
			disabled={deleteConfirmation !== $currentLanguage?.name}
		>
			Delete Forever
		</Button>
	{/snippet}
</Modal>

<style>
	.settings-page {
		max-width: 800px;
	}

	h1 {
		margin-bottom: var(--space-6);
	}

	.settings-section {
		margin-bottom: var(--space-6);
	}

	.section-description {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-4);
	}

	.section-actions {
		display: flex;
		justify-content: flex-end;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.form-group label {
		font-size: var(--size-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.checkbox-wrapper {
		justify-content: center;
	}

	.form-hint {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
		margin-top: var(--space-1);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-16);
		color: var(--color-text-secondary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: var(--space-4);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-text, .empty-text {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}

	.collaborator-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.collaborator-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}

	.collaborator-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.collaborator-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		object-fit: cover;
	}

	.collaborator-avatar.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary);
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.collaborator-details {
		display: flex;
		flex-direction: column;
	}

	.collaborator-name {
		font-weight: 500;
		font-size: var(--size-sm);
	}

	.collaborator-handle {
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
	}

	.collaborator-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.collaborator-role {
		font-size: var(--size-xs);
		padding: var(--space-1) var(--space-2);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
		text-transform: capitalize;
	}

	.add-collaborator-action {
		margin-top: var(--space-4);
	}

	.danger-zone :global(.card) {
		border-color: var(--color-error);
	}

	.danger-description {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-4);
	}

	.delete-warning {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.delete-warning ul {
		margin: 0;
		padding-left: var(--space-6);
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}

	.delete-warning li {
		margin-bottom: var(--space-1);
	}
</style>
