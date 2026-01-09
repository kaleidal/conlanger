<script lang="ts">
	interface Props {
		for?: string;
		required?: boolean;
		label: string;
		hint?: string;
	}
	
	let {
		for: htmlFor,
		required = false,
		label,
		hint
	}: Props = $props();
</script>

<div class="form-field">
	<label class="label" for={htmlFor}>
		{label}
		{#if required}
			<span class="required">*</span>
		{/if}
	</label>
	{#if hint}
		<span class="hint">{hint}</span>
	{/if}
</div>

<style>
	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-bottom: var(--space-2);
	}
	
	.label {
		font-size: var(--size-sm);
		font-weight: 500;
		color: var(--color-text);
	}
	
	.required {
		color: var(--color-error);
		margin-left: var(--space-1);
	}
	
	.hint {
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
	}
</style>
