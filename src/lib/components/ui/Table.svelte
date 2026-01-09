<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Column<T> {
		key: string;
		header: string;
		width?: string;
		align?: 'left' | 'center' | 'right';
		render?: Snippet<[T]>;
	}
	
	interface Props<T> {
		columns: Column<T>[];
		data: T[];
		rowKey?: (item: T) => string;
		onrowclick?: (item: T) => void;
		emptyMessage?: string;
	}
	
	let {
		columns,
		data,
		rowKey = (item: any) => item.id ?? JSON.stringify(item),
		onrowclick,
		emptyMessage = 'No data'
	}: Props<Record<string, any>> = $props();
</script>

<div class="table-container">
	<table class="table">
		<thead>
			<tr>
				{#each columns as column}
					<th style:width={column.width} style:text-align={column.align ?? 'left'}>
						{column.header}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if data.length === 0}
				<tr>
					<td colspan={columns.length} class="empty">
						{emptyMessage}
					</td>
				</tr>
			{:else}
				{#each data as item (rowKey(item))}
					<tr 
						class:clickable={!!onrowclick}
						onclick={() => onrowclick?.(item)}
					>
						{#each columns as column}
							<td style:text-align={column.align ?? 'left'}>
								{#if column.render}
									{@render column.render(item)}
								{:else}
									{item[column.key] ?? ''}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--size-sm);
	}
	
	th {
		padding: var(--space-3) var(--space-4);
		background: var(--color-bg-tertiary);
		font-weight: 600;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}
	
	td {
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	
	tr:last-child td {
		border-bottom: none;
	}
	
	.clickable {
		cursor: pointer;
		transition: background var(--transition-fast);
	}
	
	.clickable:hover {
		background: var(--color-bg-hover);
	}
	
	.empty {
		text-align: center;
		padding: var(--space-8);
		color: var(--color-text-secondary);
	}
</style>
