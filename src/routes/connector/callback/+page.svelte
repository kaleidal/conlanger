<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getUserId, isAuthenticated, runAction } from "$lib/convex";
  import {
    clearConnectorState,
    handleConnectorCallback,
  } from "$lib/auth/connector";

  let loading = $state(true);
  let error = $state("");

  onMount(async () => {
    if (!$isAuthenticated) {
      goto("/");
      return;
    }

    try {
      const callback = handleConnectorCallback();
      if (!callback) {
        throw new Error("Invalid connector callback state.");
      }

      const userId = getUserId();
      if (!userId) {
        throw new Error("You must be signed in to complete connector setup.");
      }

      const redirectUri = `${window.location.origin}/connector/callback`;
      await runAction("connector:completeConnectorGrant", {
        userId,
        code: callback.code,
        codeVerifier: callback.codeVerifier || undefined,
        redirectUri,
        resource: callback.resource,
        scope: callback.scope,
        mode: callback.mode,
      });

      clearConnectorState();
      goto(callback.returnTo);
    } catch (e) {
      console.error("Connector callback failed:", e);
      clearConnectorState();
      error = e instanceof Error ? e.message : "Failed to complete connector setup.";
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Connecting Apps... - Conlanger</title>
</svelte:head>

<div class="callback-page">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Completing Ave connector setup...</p>
    </div>
  {:else}
    <div class="error">
      <h2>Connector Setup Failed</h2>
      <p>{error}</p>
      <a href="/languages">Return to languages</a>
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
