<script lang="ts">
	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}
	
	interface Props {
		options: Option[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		size?: 'sm' | 'md' | 'lg';
		onchange?: (value: string) => void;
	}
	
	let {
		options,
		value = $bindable(),
		placeholder = 'Select...',
		disabled = false,
		required = false,
		id,
		name,
		size = 'md',
		onchange
	}: Props = $props();
	
	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		value = target.value;
		onchange?.(target.value);
	}
</script>

<select
	value={value ?? ''}
	{disabled}
	{required}
	{id}
	{name}
	class="select select-{size}"
	onchange={handleChange}
>
	{#if placeholder}
		<option value="" disabled>{placeholder}</option>
	{/if}
	{#each options as option}
		<option value={option.value} disabled={option.disabled}>
			{option.label}
		</option>
	{/each}
</select>

<style>
	.select {
		width: 100%;
		background: var(--color-bg);
		border: none;
		border-bottom: 1px solid var(--color-border);
		border-radius: 0;
		color: var(--color-text);
		cursor: pointer;
		transition: border-color var(--transition-fast);
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 8px center;
		padding-right: 32px;
	}
	
	.select:focus {
		outline: none;
		border-bottom-color: var(--color-primary);
	}
	
	.select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.select-sm {
		height: 32px;
		padding: 0 var(--space-3);
		padding-right: 32px;
		font-size: var(--size-sm);
	}
	
	.select-md {
		height: 40px;
		padding: 0 var(--space-4);
		padding-right: 32px;
		font-size: var(--size-md);
	}
	
	.select-lg {
		height: 48px;
		padding: 0 var(--space-5);
		padding-right: 32px;
		font-size: var(--size-lg);
	}
</style>
