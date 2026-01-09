<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		open: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	}
	
	let {
		open = $bindable(false),
		title,
		size = 'md',
		onclose,
		children,
		footer
	}: Props = $props();
	
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
	
	$effect(() => {
		if (open) {
			document.body.classList.add('modal-open');
		} else {
			document.body.classList.remove('modal-open');
		}
		return () => {
			document.body.classList.remove('modal-open');
		};
	});
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onclose();
		}
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div use:portal>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="modal-backdrop" 
			onclick={handleBackdropClick} 
			onkeydown={(e) => e.key === 'Escape' && onclose()}
			role="dialog" 
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
			tabindex="-1"
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal modal-{size}" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				{#if title}
					<div class="modal-header">
						<h2 id="modal-title" class="modal-title">{title}</h2>
						<button class="modal-close" onclick={onclose} aria-label="Close">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
				{/if}
				<div class="modal-body">
					{@render children()}
				</div>
				{#if footer}
					<div class="modal-footer">
						{@render footer()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body.modal-open) {
		overflow: hidden;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		margin: 0;
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-modal);
		animation: fadeIn 0.15s ease;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	.modal {
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		max-height: 90vh;
		max-width: calc(100% - var(--space-8));
		display: flex;
		flex-direction: column;
		animation: slideUp 0.15s ease;
	}
	
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.modal-sm { width: 400px; }
	.modal-md { width: 560px; }
	.modal-lg { width: 720px; }
	.modal-xl { width: 960px; }
	
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}
	
	.modal-title {
		font-family: var(--font-serif);
		font-size: var(--size-xl);
		font-weight: 500;
	}
	
	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.modal-close:hover {
		background: var(--color-bg-hover);
		color: var(--color-text);
	}
	
	.modal-body {
		padding: var(--space-6);
		overflow-y: auto;
		flex: 1;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	
	.modal-body::-webkit-scrollbar {
		display: none;
	}
	
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}
</style>
