<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { currentLanguage } from '$lib/stores';
	import { onMount, onDestroy } from 'svelte';
	
	interface Props {
		children: Snippet;
	}
	
	let { children }: Props = $props();
	
	const languageId = $derived($page.params.id);
	
	const navItems = $derived([
		{ href: `/lang/${languageId}`, label: 'Overview', exact: true },
		{ href: `/lang/${languageId}/phonology`, label: 'Phonology' },
		{ href: `/lang/${languageId}/morphology`, label: 'Morphology' },
		{ href: `/lang/${languageId}/syntax`, label: 'Syntax' },
		{ href: `/lang/${languageId}/lexicon`, label: 'Lexicon' },
		{ href: `/lang/${languageId}/scripts`, label: 'Scripts' },
		{ href: `/lang/${languageId}/texts`, label: 'Texts' },
		{ href: `/lang/${languageId}/tools`, label: 'Tools' }
	]);
	
	onMount(() => {
		currentLanguage.load(languageId);
	});
	
	onDestroy(() => {
		currentLanguage.clear();
	});
	
	function isActive(href: string, exact?: boolean) {
		if (exact) {
			return $page.url.pathname === href;
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="language-layout">
	<header class="language-header">
		<div class="header-left">
			<a href="/" class="back-link" aria-label="Back to language list">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</a>
			<div class="language-info">
				{#if $currentLanguage}
					<h1 class="language-name">{$currentLanguage.name}</h1>
					{#if $currentLanguage.nativeName}
						<span class="native-name">{$currentLanguage.nativeName}</span>
					{/if}
				{:else}
					<div class="skeleton" style="width: 120px; height: 24px;"></div>
				{/if}
			</div>
		</div>
	</header>
	
	<nav class="language-nav">
		{#each navItems as item}
			<a 
				href={item.href}
				class="nav-link"
				class:active={isActive(item.href, item.exact)}
			>
				{item.label}
			</a>
		{/each}
	</nav>
	
	<main class="language-content">
		{@render children()}
	</main>
</div>

<style>
	.language-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	
	.language-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-6);
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border);
	}
	
	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}
	
	.back-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}
	
	.back-link:hover {
		background: var(--color-bg-hover);
		color: var(--color-text);
	}
	
	.language-info {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
	}
	
	.language-name {
		font-size: var(--size-xl);
		font-weight: 600;
	}
	
	.native-name {
		font-size: var(--size-md);
		color: var(--color-text-secondary);
	}
	
	.skeleton {
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-sm);
		animation: pulse 1.5s infinite;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
	
	.language-nav {
		display: flex;
		gap: var(--space-1);
		padding: 0 var(--space-6);
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border);
		overflow-x: auto;
		overflow-y: hidden;
	}
	
	.nav-link {
		padding: var(--space-3) var(--space-4);
		font-size: var(--size-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		white-space: nowrap;
		transition: all var(--transition-fast);
	}
	
	.nav-link:hover {
		color: var(--color-text);
	}
	
	.nav-link.active {
		color: var(--color-text);
		border-bottom-color: var(--color-primary);
	}
	
	.language-content {
		flex: 1;
		padding: var(--space-8) var(--space-6);
		display: flex;
		justify-content: center;
	}
	
	.language-content > :global(*) {
		width: 100%;
		max-width: 1200px;
	}
</style>
