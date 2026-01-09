<script lang="ts">
	import { Card, Button, Input, Alert } from '$lib/components/ui';
	import { user, isAuthenticated, logout } from '$lib/convex';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let loading = $state(true);

	onMount(() => {
		if (!$isAuthenticated) {
			goto('/');
			return;
		}
		loading = false;
	});

	async function handleLogout() {
		await logout();
		goto('/');
	}
</script>

<svelte:head>
	<title>Settings | Conlanger</title>
</svelte:head>

<div class="settings-page">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading settings...</p>
		</div>
	{:else if $user}
		<h1>Account Settings</h1>

		<section class="settings-section">
			<Card title="Profile">
				<div class="profile-info">
					<div class="profile-avatar-section">
						{#if $user.avatarUrl}
							<img src={$user.avatarUrl} alt="" class="profile-avatar" />
						{:else}
							<div class="profile-avatar placeholder">
								{$user.displayName?.charAt(0) ?? '?'}
							</div>
						{/if}
					</div>
					<div class="profile-details">
						<div class="info-row">
							<span class="info-label">Display Name</span>
							<span class="info-value">{$user.displayName}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Handle</span>
							<span class="info-value">@{$user.handle}</span>
						</div>
						{#if $user.email}
							<div class="info-row">
								<span class="info-label">Email</span>
								<span class="info-value">{$user.email}</span>
							</div>
						{/if}
					</div>
				</div>
				<p class="profile-note">
					Your profile information is managed through Ave. To update your profile, visit your Ave account settings.
				</p>
			</Card>
		</section>

		<section class="settings-section">
			<Card title="Session">
				<p class="section-description">
					You are currently signed in via Ave. Sign out to end your session on this device.
				</p>
				<Button variant="secondary" onclick={handleLogout}>
					Sign Out
				</Button>
			</Card>
		</section>

		<section class="settings-section">
			<Card title="Data & Privacy">
				<p class="section-description">
					Your data is stored securely and is subject to our privacy policy.
				</p>
				<div class="link-list">
					<a href="/privacy" class="text-link">Privacy Policy</a>
					<a href="/terms" class="text-link">Terms of Service</a>
				</div>
			</Card>
		</section>
	{:else}
		<Alert type="warning" message="You need to be signed in to view your settings." />
		<p class="signin-link"><a href="/" class="text-link">Go to home page</a></p>
	{/if}
</div>

<style>
	.settings-page {
		max-width: 600px;
		margin: 0 auto;
		padding: var(--space-8) var(--space-6);
	}

	h1 {
		margin-bottom: var(--space-6);
	}

	.settings-section {
		margin-bottom: var(--space-6);
	}

	.section-description {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-4);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-16);
		color: var(--color-text-secondary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: var(--space-4);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.profile-info {
		display: flex;
		gap: var(--space-6);
		margin-bottom: var(--space-4);
	}

	.profile-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile-avatar.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary);
		color: var(--color-text-inverse);
		font-size: var(--size-2xl);
		font-weight: 600;
	}

	.profile-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		justify-content: center;
	}

	.info-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.info-label {
		font-size: var(--size-xs);
		font-weight: 500;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: var(--size-sm);
	}

	.profile-note {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}

	.link-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.text-link {
		font-size: var(--size-sm);
		color: var(--color-accent);
	}

	.text-link:hover {
		text-decoration: underline;
	}

	.signin-link {
		margin-top: var(--space-4);
		font-size: var(--size-sm);
	}
</style>
