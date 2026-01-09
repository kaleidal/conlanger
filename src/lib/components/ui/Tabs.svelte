<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Tab {
		id: string;
		label: string;
		disabled?: boolean;
	}
	
	interface Props {
		tabs: Tab[];
		activeTab: string;
		ontabchange: (tabId: string) => void;
		children: Snippet;
	}
	
	let {
		tabs,
		activeTab = $bindable(''),
		ontabchange,
		children
	}: Props = $props();
</script>

<div class="tabs">
	<div class="tab-list" role="tablist">
		{#each tabs as tab}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				disabled={tab.disabled}
				role="tab"
				aria-selected={activeTab === tab.id}
				onclick={() => ontabchange(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
	<div class="tab-content" role="tabpanel">
		{@render children()}
	</div>
</div>

<style>
	.tabs {
		display: flex;
		flex-direction: column;
	}
	
	.tab-list {
		display: flex;
		gap: var(--space-1);
		border-bottom: 1px solid var(--color-border);
		overflow-x: auto;
		overflow-y: hidden;
	}
	
	.tab {
		padding: var(--space-3) var(--space-4);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		font-weight: 500;
		white-space: nowrap;
		transition: all var(--transition-fast);
		margin-bottom: -1px;
	}
	
	.tab:hover:not(:disabled) {
		color: var(--color-text);
	}
	
	.tab.active {
		color: var(--color-text);
		border-bottom-color: var(--color-primary);
	}
	
	.tab:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.tab-content {
		padding: var(--space-4) 0;
	}
</style>
