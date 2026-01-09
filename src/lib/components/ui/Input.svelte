<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'search' | 'number' | 'tel' | 'url';
		value?: string | number;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		size?: 'sm' | 'md' | 'lg';
		error?: string;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}
	
	let {
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		readonly = false,
		required = false,
		id,
		name,
		size = 'md',
		error,
		oninput,
		onchange,
		onkeydown
	}: Props = $props();
</script>

<div class="input-wrapper">
	<input
		{type}
		bind:value
		{placeholder}
		{disabled}
		{readonly}
		{required}
		{id}
		{name}
		class="input input-{size}"
		class:error
		autocomplete="off"
		{oninput}
		{onchange}
		{onkeydown}
	/>
	{#if error}
		<span class="error-text">{error}</span>
	{/if}
</div>

<style>
	.input-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.input {
		width: 100%;
		background: var(--color-bg);
		border: none;
		border-bottom: 1px solid var(--color-border);
		border-radius: 0;
		color: var(--color-text);
		transition: border-color var(--transition-fast);
	}
	
	.input:focus {
		outline: none;
		border-bottom-color: var(--color-primary);
	}
	
	.input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.input::placeholder {
		color: var(--color-text-tertiary);
	}
	
	.input.error {
		border-bottom-color: var(--color-error);
	}
	
	.input-sm {
		height: 32px;
		padding: 0 var(--space-3);
		font-size: var(--size-sm);
	}
	
	.input-md {
		height: 40px;
		padding: 0 var(--space-4);
		font-size: var(--size-md);
	}
	
	.input-lg {
		height: 48px;
		padding: 0 var(--space-5);
		font-size: var(--size-lg);
	}
	
	.error-text {
		font-size: var(--size-sm);
		color: var(--color-error);
	}
</style>
