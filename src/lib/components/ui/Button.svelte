<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}
	
	let {
		variant = 'secondary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		onclick,
		children
	}: Props = $props();
</script>

<button
	{type}
	class="btn btn-{variant} btn-{size}"
	disabled={disabled || loading}
	onclick={onclick}
>
	{#if loading}
		<span class="spinner"></span>
	{/if}
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		font-weight: 500;
		border: none;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		white-space: nowrap;
		letter-spacing: 0.01em;
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-sm {
		height: 32px;
		padding: 0 var(--space-3);
		font-size: var(--size-sm);
	}
	
	.btn-md {
		height: 40px;
		padding: 0 var(--space-4);
		font-size: var(--size-md);
	}
	
	.btn-lg {
		height: 48px;
		padding: 0 var(--space-6);
		font-size: var(--size-lg);
	}
	
	.btn-primary {
		background: var(--color-primary);
		color: var(--color-text-inverse);
	}
	
	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}
	
	.btn-secondary {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: var(--color-bg-hover);
	}
	
	.btn-ghost {
		background: transparent;
		color: var(--color-text);
	}
	
	.btn-ghost:hover:not(:disabled) {
		background: var(--color-bg-hover);
	}
	
	.btn-danger {
		background: var(--color-error);
		color: white;
	}
	
	.btn-danger:hover:not(:disabled) {
		background: #a51d29;
	}
	
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
