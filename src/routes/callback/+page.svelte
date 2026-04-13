<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { finishPkceLogin } from '@ave-id/sdk/client';
	import { AVE_CLIENT_ID } from '$lib/auth/ave';
	import { auth, runMutation } from '$lib/convex';

	let error = $state('');
	let loading = $state(true);

	onMount(async () => {
		const redirectUri = `${window.location.origin}/callback`;
		const params = new URLSearchParams(window.location.search);
		if (!params.has('code')) {
			goto('/');
			return;
		}

		try {
			const tokens = await finishPkceLogin({
				clientId: AVE_CLIENT_ID,
				redirectUri
			});

			if (!tokens?.user?.id) {
				error = 'Authentication failed. Please try again.';
				loading = false;
				return;
			}

			const u = tokens.user;

			const userId = await runMutation<string>('auth:upsertUser', {
				aveId: u.id,
				handle: u.handle,
				displayName: u.displayName,
				email: u.email,
				avatarUrl: u.avatarUrl
			});

			const token = crypto.randomUUID();
			const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

			await runMutation('auth:createSession', {
				userId,
				token,
				expiresAt
			});

			auth.setUser(
				{
					_id: userId,
					aveId: u.id,
					handle: u.handle,
					displayName: u.displayName,
					email: u.email ?? undefined,
					avatarUrl: u.avatarUrl ?? undefined
				},
				token
			);

			goto('/languages');
		} catch (e) {
			console.error('Callback error:', e);
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
		to {
			transform: rotate(360deg);
		}
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
