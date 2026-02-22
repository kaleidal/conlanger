<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { currentLanguage, presence, activityLog } from '$lib/stores';
	import { sessionId, getUserId, isAuthenticated, isLoading } from '$lib/convex';
	import { onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import PresenceBar from '$lib/components/PresenceBar.svelte';
	import ActivityFeed from '$lib/components/ActivityFeed.svelte';
	import LanguageAssistantSidebar from '$lib/components/LanguageAssistantSidebar.svelte';
	
	interface Props {
		children: Snippet;
	}
	
	let { children }: Props = $props();
	let showActivity = $state(false);
	let showAssistant = $state(false);
	
	const languageId = $derived($page.params.id);
	const canEdit = $derived($currentLanguage?.access?.canWrite ?? false);
	const isOwner = $derived($currentLanguage?.access?.isOwner ?? false);
	
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
	
	let startedRealtime = $state(false);
	let loadKey = $state<string | null>(null);
	let realtimeLanguageId = $state<string | null>(null);

	async function loadLanguageIfReady() {
		const id = languageId;
		if (!id || $isLoading) return;

		const key = `${id}:${$isAuthenticated ? 'auth' : 'anon'}`;
		if (loadKey === key) return;
		loadKey = key;

		await currentLanguage.load(id);

		if ($isAuthenticated) {
			if (realtimeLanguageId !== id) {
				if (startedRealtime) {
					presence.stop(sessionId);
					activityLog.stop();
				}
				presence.start(id, sessionId);
				activityLog.start(id);
				startedRealtime = true;
				realtimeLanguageId = id;
			}
		} else if (startedRealtime) {
			presence.stop(sessionId);
			activityLog.stop();
			startedRealtime = false;
			realtimeLanguageId = null;
		}
	}

	$effect(() => {
		loadLanguageIfReady();
	});
	
	onDestroy(() => {
		currentLanguage.clear();
		presence.stop(sessionId);
		activityLog.stop();
	});
	
	function isActive(href: string, exact?: boolean) {
		if (exact) {
			return $page.url.pathname === href;
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="language-layout">
	<!-- Presence Bar for real-time collaboration -->
	<PresenceBar presence={$presence} currentUserId={getUserId() ?? undefined} />
	
	<header class="language-header">
		<div class="header-left">
			<a href="/languages" class="back-link" aria-label="Back to language list">
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
					{#if $currentLanguage.isPublic}
						<span class="public-badge">Public</span>
					{/if}
					{#if !canEdit}
						<span class="readonly-badge">View only</span>
					{/if}
				{:else}
					<div class="skeleton" style="width: 120px; height: 24px;"></div>
				{/if}
			</div>
		</div>
		
		<div class="header-right">
			{#if $currentLanguage && isOwner}
				<a href="/lang/{languageId}/settings" class="header-btn" title="Language Settings">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="3"></circle>
						<path d="M12 1v6m0 6v10M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M1 12h6m6 0h10M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"></path>
					</svg>
				</a>
			{/if}
			<button
				class="header-btn"
				class:active={showAssistant}
				onclick={() => showAssistant = !showAssistant}
				title="Language Assistant"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M8 9h8"></path>
					<path d="M8 13h5"></path>
					<path d="M17 3H7a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h5l4 3v-3h1a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4Z"></path>
				</svg>
			</button>
			<button 
				class="header-btn" 
				class:active={showActivity}
				onclick={() => showActivity = !showActivity}
				title="Activity Log"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
				</svg>
			</button>
		</div>
	</header>
	
	<div class="language-body">
		<section class="language-main-column">
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
		</section>

		{#if showActivity && showAssistant}
			<aside class="activity-sidebar split" in:fly={{ x: 24, duration: 180 }} out:fly={{ x: 24, duration: 150 }}>
				<div class="sidebar-header">
					<h2>Activity</h2>
					<button class="close-btn" onclick={() => showActivity = false} aria-label="Close activity panel">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
				<div class="activity-scroll">
					<ActivityFeed activities={$activityLog} />
				</div>
			</aside>

			<aside class="assistant-sidebar split" in:fly={{ x: 24, duration: 220 }} out:fly={{ x: 24, duration: 150 }}>
				<LanguageAssistantSidebar
					languageId={languageId}
					languageName={$currentLanguage?.name ?? 'Language'}
					canWrite={canEdit}
					embedded={true}
				/>
			</aside>
		{:else if showAssistant}
			<aside class="assistant-sidebar" in:fly={{ x: 24, duration: 220 }} out:fly={{ x: 24, duration: 150 }}>
				<LanguageAssistantSidebar
					languageId={languageId}
					languageName={$currentLanguage?.name ?? 'Language'}
					canWrite={canEdit}
					embedded={true}
				/>
			</aside>
		{:else if showActivity}
			<aside class="activity-sidebar" in:fly={{ x: 24, duration: 180 }} out:fly={{ x: 24, duration: 150 }}>
				<div class="sidebar-header">
					<h2>Activity</h2>
					<button class="close-btn" onclick={() => showActivity = false} aria-label="Close activity panel">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
				<div class="activity-scroll">
					<ActivityFeed activities={$activityLog} />
				</div>
			</aside>
		{/if}
	</div>
</div>

<style>
	.language-layout {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 61px);
		min-height: calc(100vh - 60px);
		overflow: hidden;
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
	
	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-decoration: none;
	}
	
	.header-btn:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	
	.header-btn.active {
		background: var(--color-accent-light);
		border-color: var(--color-accent);
		color: var(--color-accent);
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
		align-items: center;
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
	
	.public-badge, .readonly-badge {
		font-size: var(--size-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
	}
	
	.public-badge {
		background: var(--color-success-light);
		color: var(--color-success);
	}
	
	.readonly-badge {
		background: var(--color-warning-light);
		color: var(--color-warning);
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
		text-decoration: none;
	}
	
	.nav-link.active {
		color: var(--color-text);
		border-bottom-color: var(--color-primary);
	}
	
	.language-body {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.language-main-column {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.language-content {
		flex: 1;
		min-height: 0;
		padding: var(--space-8) var(--space-6);
		display: flex;
		justify-content: center;
		overflow-y: auto;
	}
	
	.language-content > :global(*) {
		width: 100%;
		max-width: 1200px;
		padding-bottom: var(--space-10);
		box-sizing: border-box;
	}
	
	.assistant-sidebar {
		width: 360px;
		border-left: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
		overflow: hidden;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.assistant-sidebar.split {
		width: 340px;
	}

	.activity-sidebar {
		width: 320px;
		border-left: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
		overflow: hidden;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.activity-sidebar.split {
		width: 260px;
	}

	.activity-scroll {
		overflow: hidden;
		min-height: 0;
	}
	
	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	
	.sidebar-header h2 {
		font-size: var(--size-md);
		font-weight: 500;
	}
	
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
	}
	
	.close-btn:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	
	@media (max-width: 768px) {
		.assistant-sidebar,
		.activity-sidebar {
			position: fixed;
			top: 0;
			right: 0;
			bottom: 0;
			z-index: var(--z-modal);
			box-shadow: var(--shadow-lg);
		}
	}
</style>
