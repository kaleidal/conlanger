<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import { Button } from "$lib/components/ui";
  import { convex, getUserId, runMutation, runQuery } from "$lib/convex";
  import { startAveConnectorFlow } from "$lib/auth/connector";

  const CONNECTOR_RESOURCE =
    import.meta.env.VITE_IRIS_CONNECTOR_RESOURCE || "https://irischat.app/delegated";
  const LEGACY_CONNECTOR_RESOURCE = "iris:inference";

  interface Props {
    languageId: string;
    languageName?: string;
    canWrite: boolean;
  }

  let { languageId, languageName = "Language", canWrite }: Props = $props();

  type ToolExecution = { tool: string; ok: boolean; result: unknown };
  type Msg = { role: "user" | "assistant"; content: string; toolExecutions?: ToolExecution[] };
  type RunEvent = {
    _id: string;
    kind: "status" | "assistant_thought" | "tool_start" | "tool_result" | "final" | "error";
    message?: string;
    tool?: string;
    ok?: boolean;
    payload?: unknown;
    sequence: number;
  };

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
  let importFileName = $state<string | null>(null);
  let importPreview = $state<string>("");
  let importError = $state<string | null>(null);
  let importing = $state(false);
  let activeRunId = $state<string | null>(null);
  let activeRunStatus = $state<"queued" | "running" | "completed" | "failed" | null>(null);
  let activeRun = $state<{ _id: string; status: string; finalReply?: string; error?: string } | null>(null);
  let liveEvents = $state<RunEvent[]>([]);
  let finalizedRunIds = new Set<string>();
  let runUnsubscribe: (() => void) | null = null;
  let eventsUnsubscribe: (() => void) | null = null;
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
      const grant =
        (await runQuery<any>("connector:getConnectorGrant", {
          userId,
          resource: CONNECTOR_RESOURCE,
        })) ||
        (await runQuery<any>("connector:getConnectorGrant", {
          userId,
          resource: LEGACY_CONNECTOR_RESOURCE,
        }));

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
      resource: CONNECTOR_RESOURCE,
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
      resource: CONNECTOR_RESOURCE,
    });
    await runMutation("connector:disconnectConnectorGrant", {
        userId,
      resource: LEGACY_CONNECTOR_RESOURCE,
      });
    connectorConnected = false;
  }

  function parseCsv(text: string): Record<string, string>[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: Record<string, string>[] = [];
    for (let index = 1; index < lines.length; index++) {
      const values = lines[index].split(",");
      const row: Record<string, string> = {};
      headers.forEach((header, position) => {
        row[header] = (values[position] || "").trim();
      });
      rows.push(row);
    }
    return rows;
  }

  async function parseImportFile(file: File): Promise<Record<string, unknown>[]> {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
      const text = await file.text();
      return parseCsv(text);
    }

    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      const xlsx = await import("xlsx");
      const bytes = await file.arrayBuffer();
      const workbook = xlsx.read(bytes, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) return [];
      const sheet = workbook.Sheets[firstSheet];
      return xlsx.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
    }

    throw new Error("Unsupported file type. Use CSV, XLSX, or XLS.");
  }

  async function onImportFileChange(event: Event) {
    importError = null;
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    importFileName = file.name;

    try {
      const rows = await parseImportFile(file);
      const limitedRows = rows.slice(0, 400);
      const preview = JSON.stringify(limitedRows, null, 2);
      importPreview = preview.length > 120000 ? preview.slice(0, 120000) : preview;
    } catch (e) {
      importPreview = "";
      importError = e instanceof Error ? e.message : "Failed to parse file.";
    }
  }

  async function importWithAssistant() {
    if (!importPreview || activeRunId) return;
    const userId = getUserId();
    if (!userId) return;

    importing = true;
    importError = null;
    error = null;

    const importPrompt = [
      `Import this language dataset from file: ${importFileName || "uploaded file"}.`,
      "Use available tools to create/update data in this language project.",
      "Infer mapping from columns where possible (e.g., lemma, wordClass, ipa, definitions, notes, phonemes, morphemes, syntax).",
      "Skip malformed rows safely and report what was imported, skipped, and why.",
      "Do not invent IDs; only use returned IDs from tool calls.",
      "Dataset rows (JSON):",
      importPreview,
    ].join("\n\n");

    const nextMessages: Msg[] = [...messages, { role: "user", content: importPrompt }];
    messages = nextMessages;

    try {
      const started = await runMutation<{ runId: string }>("assistant:startRun", {
        userId,
        languageId,
        model,
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      activeRunId = started.runId;
      activeRunStatus = "queued";
      activeRun = null;
      liveEvents = [];
      subscribeToRun(started.runId, userId);
      await scrollToBottom();
    } catch (e) {
      importError = e instanceof Error ? e.message : "Failed to start import.";
    } finally {
      importing = false;
    }
  }

  function stopRunSubscriptions() {
    if (runUnsubscribe) {
      runUnsubscribe();
      runUnsubscribe = null;
    }
    if (eventsUnsubscribe) {
      eventsUnsubscribe();
      eventsUnsubscribe = null;
    }
  }

  function extractToolExecutionsFromEvents(events: RunEvent[]): ToolExecution[] {
    return events
      .filter((event) => event.kind === "tool_result")
      .map((event) => ({
        tool: event.tool || "unknown",
        ok: !!event.ok,
        result: event.payload,
      }));
  }

  function maybeFinalizeRun() {
    if (!activeRun || !activeRunId) return;
    if (activeRun.status !== "completed" && activeRun.status !== "failed") return;
    if (finalizedRunIds.has(activeRunId)) return;

    finalizedRunIds.add(activeRunId);

    if (activeRun.status === "completed") {
      const finalEvent = liveEvents.find((event) => event.kind === "final");
      const payloadToolExecutions =
        finalEvent &&
        finalEvent.payload &&
        typeof finalEvent.payload === "object" &&
        Array.isArray((finalEvent.payload as any).toolExecutions)
          ? ((finalEvent.payload as any).toolExecutions as ToolExecution[])
          : null;
      const toolExecutions = payloadToolExecutions || extractToolExecutionsFromEvents(liveEvents);

      messages = [
        ...messages,
        {
          role: "assistant",
          content: activeRun.finalReply || finalEvent?.message || "Done.",
          toolExecutions,
        },
      ];
      toolSummary = toolExecutions.map((t) => `${t.ok ? "ok" : "err"}:${t.tool}`);
    } else {
      const failureMessage = activeRun.error || "Assistant run failed.";
      messages = [
        ...messages,
        {
          role: "assistant",
          content: `Run failed: ${failureMessage}`,
          toolExecutions: extractToolExecutionsFromEvents(liveEvents),
        },
      ];
      error = failureMessage;
    }

    activeRunId = null;
    activeRunStatus = null;
    activeRun = null;
    liveEvents = [];
    stopRunSubscriptions();
    scrollToBottom();
  }

  function subscribeToRun(runId: string, userId: string) {
    stopRunSubscriptions();

    runUnsubscribe = convex.onUpdate(
      "assistant:getRun" as any,
      { runId, userId },
      (run: any) => {
        activeRun = run;
        activeRunStatus = run?.status || null;
        maybeFinalizeRun();
      },
    );

    eventsUnsubscribe = convex.onUpdate(
      "assistant:getRunEvents" as any,
      { runId, userId, limit: 300 },
      (events: RunEvent[]) => {
        liveEvents = events || [];
        toolSummary = extractToolExecutionsFromEvents(liveEvents).map((t) =>
          `${t.ok ? "ok" : "err"}:${t.tool}`,
        );
        maybeFinalizeRun();
      },
    );
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
    if (!text || sending || !userId || !connectorConnected || !!activeRunId) return;

    error = null;
    sending = true;
    messages = [...messages, { role: "user", content: text }];
    prompt = "";
    await scrollToBottom();

    try {
      const started = await runMutation<{ runId: string }>("assistant:startRun", {
        userId,
        languageId,
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      activeRunId = started.runId;
      activeRunStatus = "queued";
      activeRun = null;
      liveEvents = [];
      subscribeToRun(started.runId, userId);
      await scrollToBottom();
    } catch (e) {
      error = e instanceof Error ? e.message : "Assistant request failed.";
    } finally {
      sending = false;
    }
  }

  onMount(scrollToBottom);
  onMount(loadConnectorStatus);
  onDestroy(() => stopRunSubscriptions());
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

      <div class="import-card">
        <h3>Import Language Data</h3>
        <p>
          Upload CSV/XLSX and let the assistant import it using tools. This uses Iris delegated
          inference and may consume your Iris usage.
        </p>
        <input type="file" accept=".csv,.txt,.xlsx,.xls" onchange={onImportFileChange} />
        {#if importFileName}
          <p class="import-file">Selected: {importFileName}</p>
        {/if}
        {#if importPreview}
          <details>
            <summary>Preview parsed rows</summary>
            <pre>{importPreview}</pre>
          </details>
          <Button
            size="sm"
            variant="primary"
            onclick={importWithAssistant}
            loading={importing}
            disabled={!!activeRunId}
          >
            Import with AI Assistant
          </Button>
        {/if}
        {#if importError}
          <p class="import-error">{importError}</p>
        {/if}
      </div>

      {#if activeRunId}
        <div class="run-stream">
          <div class="run-stream-header">
            <span>Agent run</span>
            <span class="status {activeRunStatus || 'queued'}">{activeRunStatus || "queued"}</span>
          </div>

          {#each liveEvents as event}
            <div class="run-event">
              <div class="run-event-line">
                <span class="kind">{event.kind}</span>
                {#if event.tool}
                  <span class="tool">{event.tool}</span>
                {/if}
                {#if event.ok !== undefined}
                  <span class="ok {event.ok ? 'yes' : 'no'}">{event.ok ? "ok" : "err"}</span>
                {/if}
              </div>
              {#if event.message}
                <p>{event.message}</p>
              {/if}
              {#if event.payload !== undefined}
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#each messages as msg}
        <div class="msg {msg.role}">
          <span class="msg-role">{msg.role === "user" ? "You" : "Assistant"}</span>
          <p>{msg.content}</p>
          {#if msg.role === "assistant" && msg.toolExecutions && msg.toolExecutions.length > 0}
            <div class="tool-calls">
              {#each msg.toolExecutions as exec}
                <div class="tool-call">
                  <span class="tool-call-name {exec.ok ? 'ok' : 'err'}">
                    {exec.ok ? "ok" : "err"}:{exec.tool}
                  </span>
                  <pre>{JSON.stringify(exec.result, null, 2)}</pre>
                </div>
              {/each}
            </div>
          {/if}
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
        {activeRunId ? "Running..." : "Send"}
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

  .import-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    background: var(--color-bg-primary);
  }

  .import-card h3 {
    margin: 0 0 var(--space-1);
    font-size: var(--size-sm);
  }

  .import-card p {
    margin: 0 0 var(--space-2);
    color: var(--color-text-secondary);
    font-size: var(--size-xs);
  }

  .import-file {
    color: var(--color-text);
  }

  .import-card input[type="file"] {
    width: 100%;
    font-size: var(--size-xs);
    margin-bottom: var(--space-2);
  }

  .import-card details {
    margin-bottom: var(--space-2);
  }

  .import-card pre {
    margin: var(--space-2) 0 0;
    max-height: 180px;
    overflow: auto;
    font-size: 11px;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
  }

  .import-error {
    color: var(--color-error) !important;
    margin-top: var(--space-2);
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

  .run-stream {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-primary);
    padding: var(--space-2);
  }

  .run-stream-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-2);
    font-size: var(--size-xs);
    color: var(--color-text-secondary);
  }

  .status {
    border-radius: 999px;
    border: 1px solid var(--color-border);
    padding: 2px 8px;
    text-transform: capitalize;
  }

  .status.running {
    border-color: color-mix(in srgb, var(--color-accent) 55%, var(--color-border));
    color: var(--color-accent);
  }

  .status.completed {
    border-color: color-mix(in srgb, var(--color-success) 55%, var(--color-border));
    color: var(--color-success);
  }

  .status.failed {
    border-color: color-mix(in srgb, var(--color-error) 55%, var(--color-border));
    color: var(--color-error);
  }

  .run-event {
    border-top: 1px dashed var(--color-border);
    padding-top: var(--space-2);
    margin-top: var(--space-2);
  }

  .run-event:first-of-type {
    border-top: none;
    margin-top: 0;
    padding-top: 0;
  }

  .run-event-line {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-wrap: wrap;
    margin-bottom: var(--space-1);
  }

  .run-event .kind,
  .run-event .tool,
  .run-event .ok {
    font-size: 11px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    padding: 2px 8px;
  }

  .run-event .ok.yes {
    color: var(--color-success);
  }

  .run-event .ok.no {
    color: var(--color-error);
  }

  .run-event p {
    margin: 0;
    white-space: pre-wrap;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .run-event pre {
    margin: var(--space-1) 0 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 11px;
    color: var(--color-text-secondary);
    max-height: 140px;
    overflow: auto;
  }

  .tool-calls {
    margin-top: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .tool-call {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-secondary);
    padding: var(--space-2);
  }

  .tool-call-name {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    margin-bottom: var(--space-2);
  }

  .tool-call-name.ok {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 40%, var(--color-border));
  }

  .tool-call-name.err {
    color: var(--color-error);
    border-color: color-mix(in srgb, var(--color-error) 40%, var(--color-border));
  }

  .tool-call pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 11px;
    line-height: 1.4;
    color: var(--color-text-secondary);
    max-height: 180px;
    overflow: auto;
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
