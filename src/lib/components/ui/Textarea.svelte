<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		rows?: number;
		resize?: 'none' | 'vertical' | 'horizontal' | 'both';
		error?: string;
		oninput?: (e: Event) => void;
	}
	
	let {
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		readonly = false,
		required = false,
		id,
		name,
		rows = 4,
		resize = 'vertical',
		error,
		oninput
	}: Props = $props();
</script>

<div class="textarea-wrapper">
	<textarea
		bind:value
		{placeholder}
		{disabled}
		{readonly}
		{required}
		{id}
		{name}
		{rows}
		class="textarea"
		class:error
		style:resize
		autocomplete="off"
		{oninput}
	></textarea>
	{#if error}
		<span class="error-text">{error}</span>
	{/if}
</div>

<style>
	.textarea-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.textarea {
		width: 100%;
		padding: var(--space-3);
		background: var(--color-bg);
		border: none;
		border-bottom: 1px solid var(--color-border);
		border-radius: 0;
		color: var(--color-text);
		font-size: var(--size-md);
		line-height: 1.5;
		transition: border-color var(--transition-fast);
	}
	
	.textarea:focus {
		outline: none;
		border-bottom-color: var(--color-primary);
	}
	
	.textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.textarea::placeholder {
		color: var(--color-text-tertiary);
	}
	
	.textarea.error {
		border-bottom-color: var(--color-error);
	}
	
	.error-text {
		font-size: var(--size-sm);
		color: var(--color-error);
	}
</style>
