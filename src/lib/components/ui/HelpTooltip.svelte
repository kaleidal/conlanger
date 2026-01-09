<script lang="ts">
	import { helpMode, helpTexts } from '$lib/stores';
	
	interface Props {
		key: string;
		inline?: boolean;
	}
	
	let { key, inline = false }: Props = $props();
	
	const help = $derived(helpTexts[key]);
	let showTooltip = $state(false);
	let triggerEl: HTMLSpanElement | undefined = $state();
	let tooltipPosition = $state({ top: 0, left: 0 });
	
	function portal(node: HTMLElement) {
		const target = document.body;
		target.appendChild(node);
		
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}
	
	function updatePosition() {
		if (!triggerEl) return;
		const rect = triggerEl.getBoundingClientRect();
		tooltipPosition = {
			top: rect.top - 8,
			left: rect.left + rect.width / 2
		};
	}
	
	function handleMouseEnter() {
		updatePosition();
		showTooltip = true;
	}
	
	function handleFocus() {
		updatePosition();
		showTooltip = true;
	}
</script>

{#if $helpMode && help}
	<span 
		bind:this={triggerEl}
		class="help-trigger"
		class:inline
		onmouseenter={handleMouseEnter}
		onmouseleave={() => showTooltip = false}
		onfocus={handleFocus}
		onblur={() => showTooltip = false}
		tabindex="0"
		role="button"
		aria-label="Help: {help.title}"
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="10"></circle>
			<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
			<line x1="12" y1="17" x2="12.01" y2="17"></line>
		</svg>
	</span>
	
	{#if showTooltip}
		<div use:portal>
			<div 
				class="help-tooltip" 
				style="top: {tooltipPosition.top}px; left: {tooltipPosition.left}px;"
			>
				<div class="help-title">{help.title}</div>
				<div class="help-description">{help.description}</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.help-trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		color: var(--color-accent);
		cursor: help;
		vertical-align: middle;
	}
	
	.help-trigger.inline {
		margin-left: var(--space-1);
	}
	
	.help-tooltip {
		position: fixed;
		transform: translate(-50%, -100%);
		width: 280px;
		padding: var(--space-3);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: calc(var(--z-modal) + 10);
		text-align: left;
		pointer-events: none;
	}
	
	.help-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: var(--color-border);
	}
	
	.help-title {
		font-size: var(--size-sm);
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--space-1);
	}
	
	.help-description {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		line-height: 1.5;
	}
</style>
