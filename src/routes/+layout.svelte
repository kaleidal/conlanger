<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { helpMode } from '$lib/stores/help';
	
	interface Props {
		children: Snippet;
	}
	
	let { children }: Props = $props();
</script>

<div class="app">
	<header class="app-header">
		<a href="/" class="logo">Conlanger</a>
		<div class="header-actions">
			<a href="/guide" class="guide-link">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
					<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
				</svg>
				<span>Guide</span>
			</a>
			<button 
				class="help-toggle" 
				class:active={$helpMode}
				onclick={() => helpMode.toggle()}
				title={$helpMode ? 'Disable help mode' : 'Enable help mode'}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
					<line x1="12" y1="17" x2="12.01" y2="17"></line>
				</svg>
				<span>Help</span>
			</button>
		</div>
	</header>
	
	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.app-header {
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.logo {
		font-family: var(--font-serif);
		font-size: var(--size-lg);
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
	}
	
	.logo:hover {
		text-decoration: none;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.guide-link {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.guide-link:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	
	.help-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.help-toggle:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	
	.help-toggle.active {
		background: var(--color-accent-light);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	
	.main {
		flex: 1;
	}
</style>
