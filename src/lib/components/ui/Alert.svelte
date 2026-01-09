<script lang="ts">
	interface Props {
		type?: 'info' | 'success' | 'warning' | 'error';
		dismissible?: boolean;
		ondismiss?: () => void;
		title?: string;
		message: string;
	}
	
	let {
		type = 'info',
		dismissible = false,
		ondismiss,
		title,
		message
	}: Props = $props();
</script>

<div class="alert alert-{type}" role="alert">
	<div class="alert-content">
		{#if title}
			<strong class="alert-title">{title}</strong>
		{/if}
		<p class="alert-message">{message}</p>
	</div>
	{#if dismissible}
		<button class="alert-dismiss" onclick={ondismiss} aria-label="Dismiss">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	{/if}
</div>

<style>
	.alert {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--size-sm);
	}
	
	.alert-info {
		background: var(--color-accent-light);
		color: var(--color-accent);
	}
	
	.alert-success {
		background: var(--color-success-light);
		color: var(--color-success);
	}
	
	.alert-warning {
		background: var(--color-warning-light);
		color: var(--color-warning);
	}
	
	.alert-error {
		background: var(--color-error-light);
		color: var(--color-error);
	}
	
	.alert-content {
		flex: 1;
	}
	
	.alert-title {
		display: block;
		margin-bottom: var(--space-1);
	}
	
	.alert-message {
		margin: 0;
	}
	
	.alert-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		color: inherit;
		opacity: 0.7;
		cursor: pointer;
		border-radius: var(--radius-sm);
	}
	
	.alert-dismiss:hover {
		opacity: 1;
	}
</style>
