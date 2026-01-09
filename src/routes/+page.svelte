<script lang="ts">
	import { Button, Card, Modal, Input, Label, Textarea } from '$lib/components/ui';
	import { languages } from '$lib/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	let showCreateModal = $state(false);
	let newLanguage = $state({ name: '', nativeName: '', description: '' });
	let loading = $state(false);
	let error = $state('');
	
	onMount(() => {
		languages.load().catch(e => {
			error = 'Failed to load languages. Make sure the database is connected.';
		});
	});
	
	async function createLanguage() {
		if (!newLanguage.name.trim()) return;
		
		loading = true;
		try {
			const created = await languages.create(newLanguage);
			showCreateModal = false;
			newLanguage = { name: '', nativeName: '', description: '' };
			goto(`/lang/${created.id}`);
		} catch (e) {
			error = 'Failed to create language';
		} finally {
			loading = false;
		}
	}
	
	async function deleteLanguage(id: string, name: string) {
		if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
			try {
				await languages.delete(id);
			} catch (e) {
				error = 'Failed to delete language';
			}
		}
	}
</script>

<svelte:head>
	<title>Conlanger - Language Creation Platform</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<div>
			<h1>Your Languages</h1>
			<p class="subtitle">Create and manage your constructed languages</p>
		</div>
		<Button variant="primary" onclick={() => showCreateModal = true}>
			New Language
		</Button>
	</header>
	
	{#if error}
		<div class="error-banner">
			{error}
			<button onclick={() => error = ''}>Dismiss</button>
		</div>
	{/if}
	
	<div class="languages-list">
		{#each $languages as language (language.id)}
			<a href="/lang/{language.id}" class="language-card">
				<div class="language-card-content">
					<h3 class="language-name">{language.name}</h3>
					{#if language.nativeName}
						<span class="language-native">{language.nativeName}</span>
					{/if}
					{#if language.description}
						<p class="language-description">{language.description}</p>
					{/if}
				</div>
				<div class="language-card-footer">
					<button 
						class="delete-btn"
						onclick={(e) => { e.preventDefault(); deleteLanguage(language.id, language.name); }}
					>
						Delete
					</button>
				</div>
			</a>
		{:else}
			<div class="empty-state">
				<div class="empty-icon">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
						<path d="M12 2L2 7l10 5 10-5-10-5z"></path>
						<path d="M2 17l10 5 10-5"></path>
						<path d="M2 12l10 5 10-5"></path>
					</svg>
				</div>
				<h2>No languages yet</h2>
				<p>Create your first constructed language to get started</p>
				<Button variant="primary" onclick={() => showCreateModal = true}>
					Create Language
				</Button>
			</div>
		{/each}
	</div>
</div>

<Modal 
	bind:open={showCreateModal} 
	title="Create New Language"
	onclose={() => showCreateModal = false}
>
	<form onsubmit={(e) => { e.preventDefault(); createLanguage(); }}>
		<div class="form-group">
			<Label for="name" label="Language Name" required />
			<Input 
				id="name"
				bind:value={newLanguage.name}
				placeholder="e.g., Elvish"
				required
			/>
		</div>
		
		<div class="form-group">
			<Label for="nativeName" label="Native Name" hint="How speakers of the language write its name" />
			<Input 
				id="nativeName"
				bind:value={newLanguage.nativeName}
				placeholder="e.g., Quenya"
			/>
		</div>
		
		<div class="form-group">
			<Label for="description" label="Description" />
			<Textarea 
				id="description"
				bind:value={newLanguage.description}
				placeholder="A brief description of your language..."
				rows={3}
			/>
		</div>
		
		<div class="form-actions">
			<Button variant="secondary" onclick={() => showCreateModal = false}>
				Cancel
			</Button>
			<Button variant="primary" type="submit" loading={loading}>
				Create Language
			</Button>
		</div>
	</form>
</Modal>

<style>
	.page {
		padding: var(--space-12) var(--space-8);
		max-width: 960px;
		margin: 0 auto;
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: var(--space-12);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}
	
	.page-header h1 {
		margin-bottom: var(--space-2);
		font-size: var(--size-3xl);
	}
	
	.subtitle {
		color: var(--color-text-secondary);
		font-size: var(--size-md);
	}
	
	.error-banner {
		background: var(--color-error-light);
		color: var(--color-error);
		padding: var(--space-4);
		margin-bottom: var(--space-8);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.error-banner button {
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		font-weight: 500;
	}
	
	.languages-list {
		display: flex;
		flex-direction: column;
	}
	
	.language-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-6) 0;
		border-bottom: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
		transition: background var(--transition-fast);
	}
	
	.language-card:first-child {
		border-top: 1px solid var(--color-border);
	}
	
	.language-card:hover {
		background: var(--color-bg-tertiary);
		margin: 0 calc(-1 * var(--space-4));
		padding-left: var(--space-4);
		padding-right: var(--space-4);
	}
	
	.language-card-content {
		flex: 1;
	}
	
	.language-name {
		font-family: var(--font-serif);
		font-size: var(--size-xl);
		font-weight: 500;
		margin-bottom: var(--space-1);
	}
	
	.language-native {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		font-style: italic;
	}
	
	.language-description {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin-top: var(--space-2);
		max-width: 600px;
	}
	
	.language-card-footer {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}
	
	.delete-btn {
		background: transparent;
		border: none;
		color: var(--color-text-tertiary);
		font-size: var(--size-sm);
		cursor: pointer;
		opacity: 0;
		transition: all var(--transition-fast);
	}
	
	.delete-btn:hover {
		color: var(--color-error);
	}
	
	.language-card:hover .delete-btn {
		opacity: 1;
	}
	
	.empty-state {
		text-align: center;
		padding: var(--space-16) 0;
		color: var(--color-text-secondary);
	}
	
	.empty-icon {
		margin-bottom: var(--space-6);
		opacity: 0.3;
	}
	
	.empty-state h2 {
		color: var(--color-text);
		margin-bottom: var(--space-3);
		font-weight: 500;
	}
	
	.empty-state p {
		margin-bottom: var(--space-8);
		font-size: var(--size-md);
	}
	
	.form-group {
		margin-bottom: var(--space-5);
	}
	
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}
</style>
