<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { helpMode } from '$lib/stores/help';
	import { auth, user, isAuthenticated, isLoading } from '$lib/convex';
	import { startAveLogin } from '$lib/auth/ave';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	interface Props {
		children: Snippet;
	}
	
	let { children }: Props = $props();
	let showUserMenu = $state(false);
	
	onMount(() => {
		auth.init();
	});
	
	function login() {
		const redirectUri = `${window.location.origin}/callback`;
		startAveLogin(redirectUri);
	}
	
	function logout() {
		auth.logout();
		showUserMenu = false;
	}
	
	// Close menu when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu-container')) {
			showUserMenu = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="app">
	<header class="app-header">
		<a href="/" class="logo">Conlanger</a>
		<nav class="nav-links">
			{#if $isAuthenticated}
				<a href="/languages" class="nav-link" class:active={$page.url.pathname === '/languages'}>
					My Languages
				</a>
			{/if}
			<a href="/explore" class="nav-link" class:active={$page.url.pathname === '/explore'}>
				Explore
			</a>
			<a href="/guide" class="nav-link" class:active={$page.url.pathname === '/guide'}>
				Guide
			</a>
		</nav>
		<div class="header-actions">
			<button 
				class="help-toggle" 
				class:active={$helpMode}
				onclick={() => helpMode.toggle()}
				title={$helpMode ? 'Disable help mode' : 'Enable help mode'}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
					<line x1="12" y1="17" x2="12.01" y2="17"></line>
				</svg>
			</button>
			
			{#if $isLoading}
				<div class="loading-indicator"></div>
			{:else if $isAuthenticated && $user}
				<div class="user-menu-container">
					<button 
						class="user-button"
						onclick={() => showUserMenu = !showUserMenu}
					>
						{#if $user.avatarUrl}
							<img src={$user.avatarUrl} alt="" class="user-avatar" />
						{:else}
							<div class="user-avatar-placeholder">
								{$user.displayName.charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="user-name">{$user.displayName}</span>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6,9 12,15 18,9"></polyline>
						</svg>
					</button>
					
					{#if showUserMenu}
						<div class="user-menu">
							<div class="user-menu-header">
								<span class="user-menu-name">{$user.displayName}</span>
								<span class="user-menu-handle">@{$user.handle}</span>
							</div>
							<div class="user-menu-divider"></div>
							<a href="/languages" class="user-menu-item">My Languages</a>
							<a href="/settings" class="user-menu-item">Settings</a>
							<div class="user-menu-divider"></div>
							<button class="user-menu-item logout" onclick={logout}>
								Sign out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button class="login-button" onclick={login}>
					Sign in with Ave
				</button>
			{/if}
		</div>
	</header>
	
	<main class="main">
		{@render children()}
	</main>
	
	{#if $page.url.pathname === '/'}
		<footer class="app-footer">
			<div class="footer-content">
				<div class="footer-links">
					<a href="/about">About</a>
					<a href="/privacy">Privacy Policy</a>
					<a href="/terms">Terms of Service</a>
					<a href="/guide">Guide</a>
				</div>
				<div class="footer-copyright">
					Conlanger - The ultimate platform for constructed languages
				</div>
			</div>
		</footer>
	{/if}
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.app-header {
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: var(--space-8);
		background: var(--color-bg-secondary);
	}
	
	.logo {
		font-family: var(--font-serif);
		font-size: var(--size-lg);
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
	}
	
	.logo:hover {
		text-decoration: none;
	}
	
	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex: 1;
	}
	
	.nav-link {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.nav-link:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		text-decoration: none;
	}
	
	.nav-link.active {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	
	.help-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.help-toggle:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	
	.help-toggle.active {
		background: var(--color-accent-light);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	
	.loading-indicator {
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.login-button {
		padding: var(--space-2) var(--space-4);
		background: var(--color-primary);
		color: var(--color-text-inverse);
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.login-button:hover {
		background: var(--color-primary-hover);
	}
	
	.user-menu-container {
		position: relative;
	}
	
	.user-button {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.user-button:hover {
		background: var(--color-bg-tertiary);
	}
	
	.user-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.user-avatar-placeholder {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-accent);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--size-sm);
		font-weight: 500;
	}
	
	.user-name {
		font-size: var(--size-sm);
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.user-menu {
		position: absolute;
		top: calc(100% + var(--space-2));
		right: 0;
		min-width: 200px;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-dropdown);
	}
	
	.user-menu-header {
		padding: var(--space-3) var(--space-4);
	}
	
	.user-menu-name {
		display: block;
		font-weight: 500;
		font-size: var(--size-sm);
	}
	
	.user-menu-handle {
		display: block;
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
	}
	
	.user-menu-divider {
		height: 1px;
		background: var(--color-border);
	}
	
	.user-menu-item {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: none;
		text-align: left;
		font-size: var(--size-sm);
		color: var(--color-text);
		text-decoration: none;
		cursor: pointer;
		transition: background var(--transition-fast);
	}
	
	.user-menu-item:hover {
		background: var(--color-bg-tertiary);
		text-decoration: none;
	}
	
	.user-menu-item.logout {
		color: var(--color-error);
	}
	
	.main {
		flex: 1;
		padding-bottom: var(--space-8);
	}
	
	.app-footer {
		border-top: 1px solid var(--color-border);
		padding: var(--space-8) var(--space-6);
		background: var(--color-bg-secondary);
	}
	
	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}
	
	.footer-links {
		display: flex;
		gap: var(--space-4);
	}
	
	.footer-links a {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		text-decoration: none;
	}
	
	.footer-links a:hover {
		color: var(--color-text);
	}
	
	.footer-copyright {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
	}
	
	@media (max-width: 768px) {
		.nav-links {
			display: none;
		}
		
		.user-name {
			display: none;
		}
		
		.footer-content {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
