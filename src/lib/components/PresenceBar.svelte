<script lang="ts">
	import type { Presence } from '$lib/stores';
	
	interface Props {
		presence: Presence[];
		currentUserId?: string;
	}
	
	let { presence, currentUserId }: Props = $props();
	
	// Filter out current user and group by page
	const otherUsers = $derived(
		presence.filter(p => p.userId !== currentUserId)
	);
	
	const usersOnSamePage = $derived(
		otherUsers.filter(p => p.currentPage === window.location.pathname)
	);
	
	const usersOnOtherPages = $derived(
		otherUsers.filter(p => p.currentPage !== window.location.pathname)
	);
	
	function getPageName(path: string): string {
		const parts = path.split('/').filter(Boolean);
		if (parts.length === 0) return 'Home';
		const last = parts[parts.length - 1];
		return last.charAt(0).toUpperCase() + last.slice(1);
	}
	
	function formatLastSeen(timestamp: number): string {
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 10) return 'now';
		if (seconds < 60) return `${seconds}s ago`;
		return `${Math.floor(seconds / 60)}m ago`;
	}
</script>

{#if otherUsers.length > 0}
	<div class="presence-bar">
		<div class="presence-label">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
				<circle cx="9" cy="7" r="4"/>
				<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
				<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
			</svg>
			<span>{otherUsers.length} collaborator{otherUsers.length > 1 ? 's' : ''} online</span>
		</div>
		
		<div class="presence-avatars">
			{#each otherUsers.slice(0, 5) as user (user._id)}
				<div 
					class="presence-avatar" 
					style="--user-color: {user.color}"
					title="{user.user?.displayName || 'Unknown'} - {getPageName(user.currentPage)}"
				>
					{#if user.user?.avatarUrl}
						<img src={user.user.avatarUrl} alt="" />
					{:else}
						<span>{(user.user?.displayName || '?').charAt(0).toUpperCase()}</span>
					{/if}
					<div class="presence-status"></div>
				</div>
			{/each}
			
			{#if otherUsers.length > 5}
				<div class="presence-overflow">
					+{otherUsers.length - 5}
				</div>
			{/if}
		</div>
		
		<div class="presence-details">
			{#if usersOnSamePage.length > 0}
				<div class="presence-group">
					<span class="presence-group-label">Here with you:</span>
					{#each usersOnSamePage as user (user._id)}
						<span class="presence-user" style="--user-color: {user.color}">
							{user.user?.displayName || 'Unknown'}
							{#if user.currentElement}
								<span class="presence-element">editing {user.currentElement}</span>
							{/if}
						</span>
					{/each}
				</div>
			{/if}
			
			{#if usersOnOtherPages.length > 0}
				<div class="presence-group">
					<span class="presence-group-label">Elsewhere:</span>
					{#each usersOnOtherPages.slice(0, 3) as user (user._id)}
						<span class="presence-user" style="--user-color: {user.color}">
							{user.user?.displayName || 'Unknown'}
							<span class="presence-page">on {getPageName(user.currentPage)}</span>
						</span>
					{/each}
					{#if usersOnOtherPages.length > 3}
						<span class="presence-more">
							+{usersOnOtherPages.length - 3} more
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.presence-bar {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-2) var(--space-4);
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border);
		font-size: var(--size-sm);
	}
	
	.presence-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}
	
	.presence-avatars {
		display: flex;
		align-items: center;
	}
	
	.presence-avatar {
		position: relative;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--user-color, var(--color-accent));
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: var(--size-xs);
		font-weight: 500;
		margin-left: -8px;
		border: 2px solid var(--color-bg-secondary);
		cursor: pointer;
	}
	
	.presence-avatar:first-child {
		margin-left: 0;
	}
	
	.presence-avatar img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.presence-status {
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 10px;
		height: 10px;
		background: var(--color-success);
		border: 2px solid var(--color-bg-secondary);
		border-radius: 50%;
	}
	
	.presence-overflow {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
		margin-left: -8px;
		border: 2px solid var(--color-bg-secondary);
	}
	
	.presence-details {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex: 1;
		overflow: hidden;
	}
	
	.presence-group {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.presence-group-label {
		color: var(--color-text-tertiary);
		white-space: nowrap;
	}
	
	.presence-user {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-sm);
		border-left: 3px solid var(--user-color, var(--color-accent));
		white-space: nowrap;
	}
	
	.presence-element, .presence-page {
		color: var(--color-text-tertiary);
		font-size: var(--size-xs);
	}
	
	.presence-more {
		color: var(--color-text-tertiary);
	}
	
	@media (max-width: 768px) {
		.presence-details {
			display: none;
		}
	}
</style>
