<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { clearAveOAuthState, handleAveCallback, isAveCallback } from '$lib/auth/ave';
	import { auth, runAction, runMutation } from '$lib/convex';

	let error = $state('');
	let loading = $state(true);

	interface AveExchangeResult {
		id: string;
		handle: string;
		displayName: string;
		email: string | null;
		avatarUrl: string | null;
		accessToken: string;
	}

	onMount(async () => {
		if (!isAveCallback()) {
			goto('/');
			return;
		}

		try {
			const redirectUri = `${window.location.origin}/callback`;
			const callbackPayload = await handleAveCallback();

			if (!callbackPayload) {
				clearAveOAuthState();
				error = 'Authentication failed. Please try again.';
				loading = false;
				return;
			}

			const aveUser = await runAction<AveExchangeResult>('auth:exchangeAveCode', {
				code: callbackPayload.code,
				codeVerifier: callbackPayload.codeVerifier,
				redirectUri
			});
			clearAveOAuthState();

			// Create or update user in Convex
			const userId = await runMutation<string>('auth:upsertUser', {
				aveId: aveUser.id,
				handle: aveUser.handle,
				displayName: aveUser.displayName,
				email: aveUser.email,
				avatarUrl: aveUser.avatarUrl
			});

			// Create session
			const token = crypto.randomUUID();
			const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

			await runMutation('auth:createSession', {
				userId,
				token,
				expiresAt
			});

			// Set auth state
			auth.setUser({
				_id: userId,
				aveId: aveUser.id,
				handle: aveUser.handle,
				displayName: aveUser.displayName,
				email: aveUser.email ?? undefined,
				avatarUrl: aveUser.avatarUrl ?? undefined
			}, token);

			// Redirect to dashboard
			goto('/languages');
		} catch (e) {
			console.error('Callback error:', e);
			clearAveOAuthState();
			error = 'An error occurred during authentication.';
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Signing in... - Conlanger</title>
</svelte:head>

<div class="callback-page">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Signing you in...</p>
		</div>
	{:else if error}
		<div class="error">
			<h2>Authentication Failed</h2>
			<p>{error}</p>
			<a href="/">Return to home</a>
		</div>
	{/if}
</div>

<style>
	.callback-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.loading {
		text-align: center;
	}
	
	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto var(--space-4);
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.loading p {
		color: var(--color-text-secondary);
	}
	
	.error {
		text-align: center;
		padding: var(--space-8);
	}
	
	.error h2 {
		margin-bottom: var(--space-4);
		color: var(--color-error);
	}
	
	.error p {
		margin-bottom: var(--space-6);
		color: var(--color-text-secondary);
	}
	
	.error a {
		color: var(--color-accent);
	}
</style>
