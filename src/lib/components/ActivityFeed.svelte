<script lang="ts">
	import type { Activity } from '$lib/stores';
	
	interface Props {
		activities: Activity[];
	}
	
	let { activities }: Props = $props();
	
	function formatTime(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		
		if (diff < 60000) return 'Just now';
		if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
		return new Date(timestamp).toLocaleDateString();
	}
	
	function getActionVerb(action: string): string {
		switch (action) {
			case 'create': return 'added';
			case 'update': return 'updated';
			case 'delete': return 'deleted';
			default: return action;
		}
	}
	
	function getEntityIcon(entityType: string): string {
		const icons: Record<string, string> = {
			phoneme: 'abc',
			word: 'book',
			morpheme: 'layers',
			grammarCategory: 'list',
			syntaxRule: 'git-branch',
			script: 'edit-3',
			text: 'file-text',
			language: 'globe'
		};
		return icons[entityType] || 'activity';
	}
</script>

<div class="activity-feed">
	<h3 class="activity-title">Recent Activity</h3>
	
	{#if activities.length === 0}
		<p class="activity-empty">No recent activity</p>
	{:else}
		<ul class="activity-list">
			{#each activities.slice(0, 20) as activity (activity._id)}
				<li class="activity-item">
					<div class="activity-avatar">
						{#if activity.user?.avatarUrl}
							<img src={activity.user.avatarUrl} alt="" />
						{:else}
							<span>{(activity.user?.displayName || '?').charAt(0).toUpperCase()}</span>
						{/if}
					</div>
					<div class="activity-content">
						<span class="activity-user">{activity.user?.displayName || 'Unknown'}</span>
						<span class="activity-action">{getActionVerb(activity.action)}</span>
						<span class="activity-entity">{activity.entityType}</span>
						{#if activity.details}
							<span class="activity-details">{activity.details}</span>
						{/if}
					</div>
					<time class="activity-time">{formatTime(activity.timestamp)}</time>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.activity-feed {
		padding: var(--space-4);
	}
	
	.activity-title {
		font-size: var(--size-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-bottom: var(--space-4);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.activity-empty {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
		text-align: center;
		padding: var(--space-6);
	}
	
	.activity-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.activity-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border);
	}
	
	.activity-item:last-child {
		border-bottom: none;
	}
	
	.activity-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-accent);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: var(--size-xs);
		font-weight: 500;
		flex-shrink: 0;
	}
	
	.activity-avatar img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.activity-content {
		flex: 1;
		font-size: var(--size-sm);
		line-height: 1.4;
	}
	
	.activity-user {
		font-weight: 500;
	}
	
	.activity-action {
		color: var(--color-text-secondary);
	}
	
	.activity-entity {
		color: var(--color-accent);
	}
	
	.activity-details {
		display: block;
		color: var(--color-text-secondary);
		font-size: var(--size-xs);
		margin-top: var(--space-1);
	}
	
	.activity-time {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
		white-space: nowrap;
	}
</style>
