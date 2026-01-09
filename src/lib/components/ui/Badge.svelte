<script lang="ts">
	interface Props {
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
		size?: 'sm' | 'md';
		label: string;
	}
	
	let {
		variant = 'default',
		size = 'sm',
		label
	}: Props = $props();
</script>

<span class="badge badge-{variant} badge-{size}">
	{label}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		font-weight: 500;
		border-radius: 999px;
		white-space: nowrap;
	}
	
	.badge-sm {
		height: 20px;
		padding: 0 var(--space-2);
		font-size: var(--size-xs);
	}
	
	.badge-md {
		height: 24px;
		padding: 0 var(--space-3);
		font-size: var(--size-sm);
	}
	
	.badge-default {
		background: var(--color-bg-tertiary);
		color: var(--color-text-secondary);
	}
	
	.badge-primary {
		background: var(--color-primary);
		color: var(--color-text-inverse);
	}
	
	.badge-success {
		background: var(--color-success-light);
		color: var(--color-success);
	}
	
	.badge-warning {
		background: var(--color-warning-light);
		color: var(--color-warning);
	}
	
	.badge-error {
		background: var(--color-error-light);
		color: var(--color-error);
	}
</style>
