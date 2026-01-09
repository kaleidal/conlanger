<script lang="ts">
	interface Props {
		checked?: boolean;
		disabled?: boolean;
		id?: string;
		name?: string;
		label?: string;
		onchange?: (e: Event) => void;
	}
	
	let {
		checked = $bindable(false),
		disabled = false,
		id,
		name,
		label,
		onchange
	}: Props = $props();
</script>

<label class="checkbox-wrapper" class:disabled>
	<input
		type="checkbox"
		bind:checked
		{disabled}
		{id}
		{name}
		class="checkbox-input"
		{onchange}
	/>
	<span class="checkbox-box">
		{#if checked}
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
				<polyline points="20 6 9 17 4 12"></polyline>
			</svg>
		{/if}
	</span>
	{#if label}
		<span class="checkbox-label">{label}</span>
	{/if}
</label>

<style>
	.checkbox-wrapper {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
		user-select: none;
	}
	
	.checkbox-wrapper.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.checkbox-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}
	
	.checkbox-box {
		width: 18px;
		height: 18px;
		min-width: 18px;
		min-height: 18px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--transition-fast), border-color var(--transition-fast);
		color: var(--color-text-inverse);
	}
	
	.checkbox-input:checked + .checkbox-box {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}
	
	.checkbox-input:focus-visible + .checkbox-box {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
	
	.checkbox-wrapper:hover:not(.disabled) .checkbox-box {
		border-color: var(--color-text-secondary);
	}
	
	.checkbox-label {
		font-size: var(--size-sm);
		color: var(--color-text);
	}
</style>
