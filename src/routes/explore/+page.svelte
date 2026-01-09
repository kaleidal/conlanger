<script lang="ts">
	import { Button, Input } from '$lib/components/ui';
	import { runQuery } from '$lib/convex';
	import { onMount } from 'svelte';
	import type { Language } from '$lib/stores';
	
	let languages = $state<Language[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	
	onMount(async () => {
		try {
			// Get public languages
			const publicLanguages = await runQuery<Language[]>('languages:listLanguages', {});
			languages = (publicLanguages || []).filter(l => l.isPublic);
		} catch (e) {
			console.error('Failed to load languages:', e);
		} finally {
			loading = false;
		}
	});
	
	const filteredLanguages = $derived(() => {
		if (!searchQuery.trim()) return languages;
		const query = searchQuery.toLowerCase();
		return languages.filter(l => 
			l.name.toLowerCase().includes(query) ||
			l.nativeName?.toLowerCase().includes(query) ||
			l.description?.toLowerCase().includes(query)
		);
	});
</script>

<svelte:head>
	<title>Explore Languages - Conlanger</title>
	<meta name="description" content="Explore public constructed languages created by the Conlanger community." />
</svelte:head>

<div class="page">
	<header class="page-header">
		<div>
			<h1>Explore Languages</h1>
			<p class="subtitle">Discover constructed languages created by the community</p>
		</div>
	</header>
	
	<div class="search-bar">
		<Input 
			placeholder="Search languages..."
			bind:value={searchQuery}
		/>
	</div>
	
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading languages...</p>
		</div>
	{:else if filteredLanguages().length === 0}
		<div class="empty-state">
			{#if searchQuery}
				<h2>No results found</h2>
				<p>Try adjusting your search query</p>
			{:else}
				<h2>No public languages yet</h2>
				<p>Be the first to share your language with the community!</p>
			{/if}
		</div>
	{:else}
		<div class="languages-grid">
			{#each filteredLanguages() as language (language._id)}
				<a href="/lang/{language._id}" class="language-card">
					<h3 class="language-name">{language.name}</h3>
					{#if language.nativeName}
						<span class="language-native">{language.nativeName}</span>
					{/if}
					{#if language.description}
						<p class="language-description">{language.description}</p>
					{/if}
					{#if language.owner}
						<div class="language-owner">
							<span>by {language.owner.displayName}</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--space-12) var(--space-8);
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.page-header {
		margin-bottom: var(--space-8);
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
	
	.search-bar {
		margin-bottom: var(--space-8);
		max-width: 400px;
	}
	
	.loading {
		text-align: center;
		padding: var(--space-16) 0;
	}
	
	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto var(--space-4);
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.loading p {
		color: var(--color-text-secondary);
	}
	
	.empty-state {
		text-align: center;
		padding: var(--space-16) 0;
		color: var(--color-text-secondary);
	}
	
	.empty-state h2 {
		color: var(--color-text);
		margin-bottom: var(--space-3);
		font-weight: 500;
	}
	
	.languages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-6);
	}
	
	.language-card {
		display: block;
		padding: var(--space-6);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: inherit;
		transition: all var(--transition-fast);
	}
	
	.language-card:hover {
		border-color: var(--color-accent);
		box-shadow: var(--shadow-md);
		text-decoration: none;
	}
	
	.language-name {
		font-family: var(--font-serif);
		font-size: var(--size-xl);
		font-weight: 500;
		margin-bottom: var(--space-1);
	}
	
	.language-native {
		display: block;
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		font-style: italic;
		margin-bottom: var(--space-2);
	}
	
	.language-description {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-4);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.language-owner {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}
</style>
