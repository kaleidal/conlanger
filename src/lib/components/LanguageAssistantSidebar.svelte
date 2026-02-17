<script lang="ts">
  import { onMount, tick } from "svelte";
  import { Button } from "$lib/components/ui";
  import { getUserId, runAction, runMutation, runQuery } from "$lib/convex";
  import { startAveConnectorFlow } from "$lib/auth/connector";

  interface Props {
    languageId: string;
    languageName?: string;
    canWrite: boolean;
  }

  let { languageId, languageName = "Language", canWrite }: Props = $props();

  type Msg = { role: "user" | "assistant"; content: string };

  let messages = $state<Msg[]>([
    {
      role: "assistant",
      content:
        canWrite
          ? `Assistant ready for ${languageName}. I can inspect and edit words/phonemes directly.`
          : `Assistant ready for ${languageName}. This language is read-only for your account, so I can analyze but not edit.`,
    },
  ]);

  let prompt = $state("");
  let model = $state("anthropic/claude-sonnet-4.5");
  let sending = $state(false);
  let error = $state<string | null>(null);
  let connectorLoading = $state(true);
  let connectorConnected = $state(false);
  let toolSummary = $state<string[]>([]);
  let chatBody: HTMLDivElement | null = null;

  async function loadConnectorStatus() {
    const userId = getUserId();
    if (!userId) {
      connectorLoading = false;
      connectorConnected = false;
      return;
    }

    connectorLoading = true;
    try {
      const grant = await runQuery<any>("connector:getConnectorGrant", {
        userId,
        resource: "iris:inference",
      });
      connectorConnected = !!grant;
    } finally {
      connectorLoading = false;
    }
  }

  async function connect() {
    const returnTo = window.location.pathname + window.location.search;
    const redirectUri = `${window.location.origin}/connector/callback`;
    await startAveConnectorFlow({
      redirectUri,
      resource: "iris:inference",
      scope: "iris.infer",
      mode: "user_present",
      returnTo,
    });
  }

  async function disconnect() {
    const userId = getUserId();
    if (!userId) return;
    await runMutation("connector:disconnectConnectorGrant", {
      userId,
      resource: "iris:inference",
    });
    connectorConnected = false;
  }

  async function scrollToBottom() {
    await tick();
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  async function send() {
    const text = prompt.trim();
    const userId = getUserId();
    if (!text || sending || !userId || !connectorConnected) return;

    error = null;
    sending = true;
    messages = [...messages, { role: "user", content: text }];
    prompt = "";
    await scrollToBottom();

    try {
      const response = await runAction<{
        reply: string;
        model: string;
        toolExecutions?: Array<{ tool: string; ok: boolean; result: unknown }>;
      }>("assistant:chat", {
        userId,
        languageId,
        model,
        messages,
      });

      messages = [...messages, { role: "assistant", content: response.reply || "(No response)" }];
      toolSummary = (response.toolExecutions || []).map((t) => `${t.ok ? "ok" : "err"}:${t.tool}`);
      await scrollToBottom();
    } catch (e) {
      error = e instanceof Error ? e.message : "Assistant request failed.";
    } finally {
      sending = false;
    }
  }

  onMount(scrollToBottom);
  onMount(loadConnectorStatus);
</script>

<aside class="assistant-panel">
  <div class="assistant-header">
    <div>
      <h2>Language Assistant</h2>
      <p>{languageName}</p>
    </div>
    <span class="write-badge {canWrite ? 'write' : 'read'}">
      {canWrite ? "Can edit" : "Read only"}
    </span>
  </div>

  <div class="assistant-body" bind:this={chatBody}>
    {#if connectorLoading}
      <div class="connect-card muted centered">
        <p>Checking Iris connector...</p>
      </div>
    {:else if !connectorConnected}
      <div class="connect-card centered">
        <h3>Connect Conlanger to Iris</h3>
        <p>Authorize Conlanger to use Iris delegated inference before chatting.</p>
        <div class="connect-actions">
          <Button size="sm" variant="primary" onclick={connect}>
            Connect to Iris
          </Button>
        </div>
      </div>
    {:else}
      <div class="connect-card connected">
        <p>Connected to Iris</p>
        <Button size="sm" variant="ghost" onclick={disconnect}>Disconnect</Button>
      </div>

      {#each messages as msg}
        <div class="msg {msg.role}">
          <span class="msg-role">{msg.role === "user" ? "You" : "Assistant"}</span>
          <p>{msg.content}</p>
        </div>
      {/each}
    {/if}
  </div>

  {#if connectorConnected && toolSummary.length > 0}
    <div class="tool-strip">
      {#each toolSummary.slice(-6) as item}
        <span>{item}</span>
      {/each}
    </div>
  {/if}

  {#if connectorConnected && error}
    <p class="error">{error}</p>
  {/if}

  {#if connectorConnected}
    <div class="assistant-input">
      <div class="model-row">
        <label for="assistant-model">Model</label>
        <input id="assistant-model" bind:value={model} placeholder="anthropic/claude-sonnet-4.5" />
      </div>
      <textarea
        bind:value={prompt}
        placeholder={canWrite ? "Ask and I can apply edits directly..." : "Ask about this language..."}
        rows="3"
        onkeydown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      ></textarea>
      <Button variant="primary" onclick={send} loading={sending} disabled={!prompt.trim()}>
        Send
      </Button>
    </div>
  {/if}
</aside>

<style>
  .assistant-panel {
    width: 420px;
    min-width: 420px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .assistant-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .assistant-header h2 {
    margin: 0;
    font-size: var(--size-md);
  }

  .assistant-header p {
    margin: var(--space-1) 0 0;
    color: var(--color-text-secondary);
    font-size: var(--size-xs);
  }

  .write-badge {
    font-size: var(--size-xs);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
  }

  .write-badge.write {
    color: var(--color-success);
    background: var(--color-success-light);
  }

  .write-badge.read {
    color: var(--color-warning);
    background: var(--color-warning-light);
  }

  .assistant-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .connect-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    background: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-primary));
  }

  .connect-card.centered {
    margin: auto 0;
    text-align: center;
  }

  .connect-card h3 {
    margin: 0 0 var(--space-1);
    font-size: var(--size-sm);
  }

  .connect-card p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--size-xs);
  }

  .connect-card.connected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    background: color-mix(in srgb, var(--color-success) 14%, var(--color-bg-primary));
  }

  .connect-card.muted {
    background: var(--color-bg-tertiary);
  }

  .connect-actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
    justify-content: center;
  }

  .msg {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    background: var(--color-bg-primary);
  }

  .msg.user {
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }

  .msg-role {
    display: inline-block;
    font-size: var(--size-xs);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-1);
  }

  .msg p {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.45;
    font-size: var(--size-sm);
  }

  .tool-strip {
    padding: 0 var(--space-4) var(--space-2);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .tool-strip span {
    font-size: 11px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    color: var(--color-text-tertiary);
    padding: 2px 8px;
  }

  .assistant-input {
    border-top: 1px solid var(--color-border);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .assistant-input textarea {
    width: 100%;
    resize: vertical;
    min-height: 72px;
    max-height: 180px;
    background: var(--color-bg-primary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    line-height: 1.4;
  }

  .model-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .model-row label {
    font-size: var(--size-xs);
    color: var(--color-text-secondary);
    min-width: 42px;
  }

  .model-row input {
    flex: 1;
    min-width: 0;
    background: var(--color-bg-primary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 6px 10px;
    font-size: var(--size-xs);
  }

  .assistant-input textarea:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent) 55%, transparent);
  }

  .error {
    margin: 0;
    padding: 0 var(--space-4) var(--space-2);
    color: var(--color-error);
    font-size: var(--size-xs);
  }

  @media (max-width: 1024px) {
    .assistant-panel {
      width: 100%;
      min-width: 0;
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: var(--z-modal);
      box-shadow: var(--shadow-lg);
    }
  }
</style>
