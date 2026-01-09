<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		title?: string;
		padding?: boolean;
		children: Snippet;
		actions?: Snippet;
	}
	
	let {
		title,
		padding = true,
		children,
		actions
	}: Props = $props();
</script>

<div class="card">
	{#if title || actions}
		<div class="card-header">
			{#if title}
				<h3 class="card-title">{title}</h3>
			{/if}
			{#if actions}
				<div class="card-actions">
					{@render actions()}
				</div>
			{/if}
		</div>
	{/if}
	<div class="card-body" class:padding>
		{@render children()}
	</div>
</div>

<style>
	.card {
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
	}
	
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}
	
	.card-title {
		font-size: var(--size-lg);
		font-weight: 500;
		margin: 0;
	}
	
	.card-actions {
		display: flex;
		gap: var(--space-2);
	}
	
	.card-body {
		min-height: 0;
	}
	
	.card-body.padding {
		padding: var(--space-6);
	}
</style>
