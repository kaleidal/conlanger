<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Card, Button, Input, Modal, Tabs, Select, Badge, Textarea, HelpTooltip } from '$lib/components/ui';
	import { runQuery, runMutation, getUserId } from '$lib/convex';
	
	const languageId = $derived($page.params.id);
	
	let activeSection = $state<'word-order' | 'syntax-rules'>('word-order');
	let loading = $state(true);
	
	let ruleModalOpen = $state(false);
	let editingRule = $state<SyntaxRule | null>(null);
	let ruleForm = $state({
		name: '',
		ruleType: 'phrase-structure',
		pattern: '',
		output: '',
		description: '',
		conditions: '',
		examples: ''
	});
	
	let saving = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	let settingsSaving = $state(false);
	
	interface SyntaxCondition {
		type: string;
		value: string;
		operator?: string;
	}
	
	interface SyntaxExample {
		input: string;
		output: string;
		gloss?: string;
		translation?: string;
	}
	
	interface SyntaxRule {
		_id: string;
		name: string;
		ruleType: string;
		pattern: string;
		output?: string;
		conditions?: SyntaxCondition[];
		description?: string;
		examples?: SyntaxExample[];
		orderIndex?: number;
	}
	
	interface LanguageSettings {
		wordOrder?: string;
		headDirection?: string;
		morphologicalType?: string;
		alignment?: string;
		nounPhraseOrder?: string;
		adpositionType?: string;
		relativeClausePosition?: string;
		questionFormation?: string;
		negationStrategy?: string;
	}
	
	interface Language {
		_id: string;
		settings?: LanguageSettings;
	}
	
	let syntaxRules = $state<SyntaxRule[]>([]);
	let language = $state<Language | null>(null);
	const settings = $derived((language?.settings ?? {}) as LanguageSettings);
	
	let localSettings = $state<LanguageSettings>({});
	
	$effect(() => {
		localSettings = { ...settings };
	});
	
	async function loadData() {
		loading = true;
		try {
			const [rulesData, langData] = await Promise.all([
				runQuery<SyntaxRule[]>('syntax:getSyntaxRules', { languageId }),
				runQuery<Language>('languages:getLanguage', { languageId })
			]);
			syntaxRules = rulesData ?? [];
			language = langData;
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		loadData();
	});
	
	const wordOrderOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'SOV', label: 'SOV (Subject-Object-Verb)' },
		{ value: 'SVO', label: 'SVO (Subject-Verb-Object)' },
		{ value: 'VSO', label: 'VSO (Verb-Subject-Object)' },
		{ value: 'VOS', label: 'VOS (Verb-Object-Subject)' },
		{ value: 'OVS', label: 'OVS (Object-Verb-Subject)' },
		{ value: 'OSV', label: 'OSV (Object-Subject-Verb)' },
		{ value: 'free', label: 'Free word order' }
	];
	
	const headDirectionOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'head-initial', label: 'Head-initial' },
		{ value: 'head-final', label: 'Head-final' },
		{ value: 'mixed', label: 'Mixed' }
	];
	
	const morphologicalTypeOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'isolating', label: 'Isolating' },
		{ value: 'agglutinative', label: 'Agglutinative' },
		{ value: 'fusional', label: 'Fusional' },
		{ value: 'polysynthetic', label: 'Polysynthetic' },
		{ value: 'oligosynthetic', label: 'Oligosynthetic' }
	];
	
	const alignmentOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'nominative-accusative', label: 'Nominative-Accusative' },
		{ value: 'ergative-absolutive', label: 'Ergative-Absolutive' },
		{ value: 'split-ergative', label: 'Split Ergative' },
		{ value: 'tripartite', label: 'Tripartite' },
		{ value: 'active-stative', label: 'Active-Stative' },
		{ value: 'direct', label: 'Direct' }
	];
	
	const adpositionOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'preposition', label: 'Prepositions' },
		{ value: 'postposition', label: 'Postpositions' },
		{ value: 'circumposition', label: 'Circumpositions' },
		{ value: 'mixed', label: 'Mixed' }
	];
	
	const nounPhraseOrderOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'NA', label: 'Noun-Adjective' },
		{ value: 'AN', label: 'Adjective-Noun' },
		{ value: 'both', label: 'Both orders possible' }
	];
	
	const relativeClauseOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'prenominal', label: 'Prenominal (before noun)' },
		{ value: 'postnominal', label: 'Postnominal (after noun)' },
		{ value: 'internally-headed', label: 'Internally-headed' },
		{ value: 'correlative', label: 'Correlative' }
	];
	
	const questionFormationOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'wh-movement', label: 'Wh-movement' },
		{ value: 'in-situ', label: 'Wh-in-situ' },
		{ value: 'particle', label: 'Question particle' },
		{ value: 'intonation', label: 'Intonation only' },
		{ value: 'inversion', label: 'Subject-verb inversion' }
	];
	
	const negationOptions = [
		{ value: '', label: 'Not specified' },
		{ value: 'preverbal', label: 'Preverbal particle' },
		{ value: 'postverbal', label: 'Postverbal particle' },
		{ value: 'circumverbal', label: 'Circumverbal' },
		{ value: 'negative-verb', label: 'Negative verb' },
		{ value: 'auxiliary', label: 'Negative auxiliary' },
		{ value: 'affix', label: 'Negative affix' }
	];
	
	const ruleTypeOptions = [
		{ value: 'phrase-structure', label: 'Phrase Structure' },
		{ value: 'transformation', label: 'Transformation' },
		{ value: 'agreement', label: 'Agreement' },
		{ value: 'movement', label: 'Movement' },
		{ value: 'constraint', label: 'Constraint' }
	];
	
	async function saveSettings() {
		settingsSaving = true;
		try {
			await runMutation('languages:updateLanguage', { 
				languageId, 
				userId: getUserId(),
				settings: localSettings as Record<string, unknown>
			});
			await loadData();
		} finally {
			settingsSaving = false;
		}
	}
	
	function openRuleModal(rule?: SyntaxRule) {
		if (rule) {
			editingRule = rule;
			ruleForm = {
				name: rule.name,
				ruleType: rule.ruleType,
				pattern: rule.pattern,
				output: rule.output ?? '',
				description: rule.description ?? '',
				conditions: rule.conditions?.map(c => `${c.type}:${c.value}`).join('\n') ?? '',
				examples: rule.examples?.map(e => `${e.input}|${e.output}|${e.gloss || ''}|${e.translation || ''}`).join('\n') ?? ''
			};
		} else {
			editingRule = null;
			ruleForm = {
				name: '',
				ruleType: 'phrase-structure',
				pattern: '',
				output: '',
				description: '',
				conditions: '',
				examples: ''
			};
		}
		ruleModalOpen = true;
	}
	
	function parseConditions(text: string): SyntaxCondition[] {
		return text.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.map(line => {
				const [type, value] = line.split(':').map(s => s.trim());
				return { type: type || '', value: value || '' };
			});
	}
	
	function parseExamples(text: string): SyntaxExample[] {
		return text.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.map(line => {
				const [input, output, gloss, translation] = line.split('|').map(s => s.trim());
				return { 
					input: input || '', 
					output: output || '', 
					gloss: gloss || undefined,
					translation: translation || undefined
				};
			});
	}
	
	async function saveRule() {
		saving = true;
		try {
			const payload = {
				languageId,
				userId: getUserId(),
				name: ruleForm.name,
				ruleType: ruleForm.ruleType,
				pattern: ruleForm.pattern,
				output: ruleForm.output || undefined,
				description: ruleForm.description || undefined,
				conditions: ruleForm.conditions ? parseConditions(ruleForm.conditions) : undefined,
				examples: ruleForm.examples ? parseExamples(ruleForm.examples) : undefined,
				orderIndex: editingRule?.orderIndex ?? syntaxRules.length
			};
			
			if (editingRule) {
				await runMutation('syntax:updateSyntaxRule', {
					ruleId: editingRule._id,
					...payload
				});
			} else {
				await runMutation('syntax:createSyntaxRule', payload);
			}
			
			await loadData();
			ruleModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteRule(id: string) {
		await runMutation('syntax:remove', { 
			id,
			userId: getUserId()
		});
		await loadData();
		deleteConfirmId = null;
	}
	
	const sections = [
		{ id: 'word-order', label: 'Word Order & Typology' },
		{ id: 'syntax-rules', label: 'Syntax Rules' }
	];
</script>

{#if loading}
	<div class="loading-container">
		<p>Loading syntax data...</p>
	</div>
{:else}
<div class="syntax-page">
	<Tabs 
		tabs={sections} 
		activeTab={activeSection} 
		ontabchange={(id) => activeSection = id as typeof activeSection}
	>
		{#if activeSection === 'word-order'}
			<div class="section">
				<div class="section-header">
					<h2>Word Order & Typology</h2>
					<Button variant="primary" onclick={saveSettings} loading={settingsSaving}>
						Save Settings
					</Button>
				</div>
				
				<div class="settings-grid">
					<Card title="Basic Word Order">
						<div class="settings-form">
							<div class="form-group">
								<label for="word-order">Constituent Order</label>
								<Select 
									id="word-order" 
									options={wordOrderOptions} 
									bind:value={localSettings.wordOrder}
								/>
								<span class="form-hint">The basic order of subject, verb, and object in declarative sentences.</span>
							</div>
							
							<div class="form-group">
								<label for="head-direction">Head Direction</label>
								<Select 
									id="head-direction" 
									options={headDirectionOptions} 
									bind:value={localSettings.headDirection}
								/>
								<span class="form-hint">Whether modifiers precede or follow their heads.</span>
							</div>
							
							<div class="form-group">
								<label for="adposition-type">Adposition Type</label>
								<Select 
									id="adposition-type" 
									options={adpositionOptions} 
									bind:value={localSettings.adpositionType}
								/>
							</div>
						</div>
					</Card>
					
					<Card title="Morphological Type">
						<div class="settings-form">
							<div class="form-group">
								<label for="morphological-type">Type</label>
								<Select 
									id="morphological-type" 
									options={morphologicalTypeOptions} 
									bind:value={localSettings.morphologicalType}
								/>
							</div>
							
							<div class="form-group">
								<label for="alignment">Alignment</label>
								<Select 
									id="alignment" 
									options={alignmentOptions} 
									bind:value={localSettings.alignment}
								/>
								<span class="form-hint">How the language treats agents and patients of transitive/intransitive verbs.</span>
							</div>
						</div>
					</Card>
					
					<Card title="Phrase Structure">
						<div class="settings-form">
							<div class="form-group">
								<label for="np-order">Noun Phrase Order</label>
								<Select 
									id="np-order" 
									options={nounPhraseOrderOptions} 
									bind:value={localSettings.nounPhraseOrder}
								/>
								<span class="form-hint">Order of adjectives relative to nouns.</span>
							</div>
							
							<div class="form-group">
								<label for="rel-clause">Relative Clause Position</label>
								<Select 
									id="rel-clause" 
									options={relativeClauseOptions} 
									bind:value={localSettings.relativeClausePosition}
								/>
							</div>
						</div>
					</Card>
					
					<Card title="Sentence Operations">
						<div class="settings-form">
							<div class="form-group">
								<label for="question-formation">Question Formation</label>
								<Select 
									id="question-formation" 
									options={questionFormationOptions} 
									bind:value={localSettings.questionFormation}
								/>
							</div>
							
							<div class="form-group">
								<label for="negation">Negation Strategy</label>
								<Select 
									id="negation" 
									options={negationOptions} 
									bind:value={localSettings.negationStrategy}
								/>
							</div>
						</div>
					</Card>
				</div>
				
				{#if settings.wordOrder || settings.morphologicalType}
					<Card title="Current Settings Summary">
						<div class="settings-summary">
							{#if settings.wordOrder}
								<div class="summary-item">
									<span class="summary-label">Word Order:</span>
									<Badge label={settings.wordOrder} />
								</div>
							{/if}
							{#if settings.headDirection}
								<div class="summary-item">
									<span class="summary-label">Head Direction:</span>
									<Badge label={settings.headDirection} />
								</div>
							{/if}
							{#if settings.morphologicalType}
								<div class="summary-item">
									<span class="summary-label">Morphological Type:</span>
									<Badge label={settings.morphologicalType} />
								</div>
							{/if}
							{#if settings.alignment}
								<div class="summary-item">
									<span class="summary-label">Alignment:</span>
									<Badge label={settings.alignment} />
								</div>
							{/if}
						</div>
					</Card>
				{/if}
			</div>
		{:else if activeSection === 'syntax-rules'}
			<div class="section">
				<div class="section-header">
					<h2>Syntax Rules</h2>
					<Button variant="primary" onclick={() => openRuleModal()}>Add Rule</Button>
				</div>
				
				<Card>
					<p class="section-desc">
						Define phrase structure rules, transformations, agreement rules, and syntactic constraints.
						These rules describe how words combine into phrases and sentences.
					</p>
				</Card>
				
				<div class="rules-list">
					{#each [...syntaxRules].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) as rule, index}
						<Card>
							<div class="rule-header">
								<span class="rule-order">{index + 1}.</span>
								<span class="rule-name">{rule.name}</span>
								<Badge label={rule.ruleType} />
							</div>
							
							<div class="rule-pattern">
								<code>{rule.pattern}</code>
								{#if rule.output}
									<span class="rule-arrow">→</span>
									<code>{rule.output}</code>
								{/if}
							</div>
							
							{#if rule.description}
								<p class="rule-desc">{rule.description}</p>
							{/if}
							
							{#if rule.conditions?.length}
								<div class="rule-conditions">
									<span class="conditions-label">Conditions:</span>
									{#each rule.conditions as condition}
										<Badge label="{condition.type}: {condition.value}" />
									{/each}
								</div>
							{/if}
							
							{#if rule.examples?.length}
								<div class="rule-examples">
									<span class="examples-label">Examples:</span>
									{#each rule.examples as example}
										<div class="example-item">
											<span class="example-input">{example.input}</span>
											<span class="example-arrow">→</span>
											<span class="example-output">{example.output}</span>
											{#if example.translation}
												<span class="example-translation">"{example.translation}"</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
							
							<div class="rule-actions">
								<Button size="sm" variant="ghost" onclick={() => openRuleModal(rule)}>Edit</Button>
								<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = rule._id}>Delete</Button>
							</div>
						</Card>
					{:else}
						<Card>
							<p class="empty-message">No syntax rules defined yet. Add phrase structure rules and transformations here.</p>
						</Card>
					{/each}
				</div>
				
				<Card title="Rule Pattern Reference">
					<div class="pattern-help">
						<p>Common notation for syntax rules:</p>
						<ul>
							<li><code>S → NP VP</code> - A sentence consists of a noun phrase and verb phrase</li>
							<li><code>NP → (Det) (Adj)* N (PP)*</code> - Noun phrase structure</li>
							<li><code>VP → V (NP) (PP)*</code> - Verb phrase structure</li>
						</ul>
						<p>Symbols:</p>
						<ul>
							<li><code>S</code> - Sentence</li>
							<li><code>NP</code> - Noun Phrase</li>
							<li><code>VP</code> - Verb Phrase</li>
							<li><code>PP</code> - Prepositional/Postpositional Phrase</li>
							<li><code>Det</code> - Determiner</li>
							<li><code>N</code>, <code>V</code>, <code>Adj</code>, <code>Adv</code> - Word classes</li>
							<li><code>( )</code> - Optional element</li>
							<li><code>*</code> - Zero or more</li>
							<li><code>+</code> - One or more</li>
						</ul>
					</div>
				</Card>
			</div>
		{/if}
	</Tabs>
</div>
{/if}

<Modal 
	bind:open={ruleModalOpen} 
	title={editingRule ? 'Edit Syntax Rule' : 'Add Syntax Rule'}
	size="lg"
	onclose={() => ruleModalOpen = false}
>
	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="rule-name">Rule Name</label>
				<Input id="rule-name" bind:value={ruleForm.name} placeholder="e.g. Basic Sentence Structure" />
			</div>
			<div class="form-group">
				<label for="rule-type">Rule Type</label>
				<Select id="rule-type" options={ruleTypeOptions} bind:value={ruleForm.ruleType} />
			</div>
		</div>
		
		<div class="form-group">
			<label for="rule-pattern">Pattern <HelpTooltip key="syntaxPattern" inline /></label>
			<Input id="rule-pattern" bind:value={ruleForm.pattern} placeholder="e.g. S → NP VP" />
			<span class="form-hint">The left-hand side or input pattern of the rule.</span>
		</div>
		
		<div class="form-group">
			<label for="rule-output">Output <HelpTooltip key="syntaxOutput" inline /></label>
			<Input id="rule-output" bind:value={ruleForm.output} placeholder="e.g. VP NP (for transformations)" />
			<span class="form-hint">For transformations, the result after applying the rule.</span>
		</div>
		
		<div class="form-group">
			<label for="rule-desc">Description</label>
			<Textarea id="rule-desc" bind:value={ruleForm.description} placeholder="Explain what this rule does..." rows={2} />
		</div>
		
		<div class="form-group">
			<label for="rule-conditions">Conditions</label>
			<Textarea 
				id="rule-conditions" 
				bind:value={ruleForm.conditions} 
				placeholder="context:main clause&#10;mood:indicative"
				rows={3}
			/>
			<span class="form-hint">One per line, format: type:value</span>
		</div>
		
		<div class="form-group">
			<label for="rule-examples">Examples</label>
			<Textarea 
				id="rule-examples" 
				bind:value={ruleForm.examples} 
				placeholder="talo-ssa asuu kissa|talo-ssa asuu kissa||A cat lives in the house"
				rows={3}
			/>
			<span class="form-hint">One per line, format: input|output|gloss|translation</span>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => ruleModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveRule} loading={saving} disabled={!ruleForm.name || !ruleForm.pattern}>
			{editingRule ? 'Update' : 'Add'} Rule
		</Button>
	{/snippet}
</Modal>

<Modal 
	open={deleteConfirmId !== null}
	title="Confirm Delete"
	size="sm"
	onclose={() => deleteConfirmId = null}
>
	<p>Are you sure you want to delete this rule? This action cannot be undone.</p>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => deleteConfirmId = null}>Cancel</Button>
		<Button variant="danger" onclick={() => deleteConfirmId && deleteRule(deleteConfirmId)}>Delete</Button>
	{/snippet}
</Modal>

<style>
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--space-12);
		color: var(--color-text-secondary);
	}
	
	.syntax-page {
		max-width: 1200px;
	}
	
	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.section-header h2 {
		font-size: var(--size-xl);
		font-weight: 600;
		margin: 0;
	}
	
	.section-desc {
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		margin: 0;
	}
	
	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: var(--space-4);
	}
	
	.settings-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.settings-summary {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
	}
	
	.summary-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.summary-label {
		font-size: var(--size-sm);
		font-weight: 500;
	}
	
	.rules-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.rule-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}
	
	.rule-order {
		color: var(--color-text-tertiary);
		font-size: var(--size-sm);
	}
	
	.rule-name {
		font-weight: 600;
	}
	
	.rule-pattern {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		font-family: monospace;
		font-size: var(--size-md);
		margin-bottom: var(--space-3);
	}
	
	.rule-arrow {
		color: var(--color-text-tertiary);
	}
	
	.rule-desc {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: var(--space-2) 0;
	}
	
	.rule-conditions,
	.rule-examples {
		margin: var(--space-3) 0;
	}
	
	.conditions-label,
	.examples-label {
		font-size: var(--size-sm);
		font-weight: 500;
		display: block;
		margin-bottom: var(--space-2);
	}
	
	.rule-conditions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		align-items: center;
	}
	
	.example-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-sm);
		font-size: var(--size-sm);
		margin-bottom: var(--space-1);
	}
	
	.example-input,
	.example-output {
		font-family: monospace;
	}
	
	.example-arrow {
		color: var(--color-text-tertiary);
	}
	
	.example-translation {
		color: var(--color-text-secondary);
		font-style: italic;
		margin-left: auto;
	}
	
	.rule-actions {
		display: flex;
		gap: var(--space-1);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}
	
	.pattern-help {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.pattern-help ul {
		margin: var(--space-2) 0;
		padding-left: var(--space-5);
	}
	
	.pattern-help li {
		margin: var(--space-1) 0;
	}
	
	.pattern-help code {
		background: var(--color-bg-tertiary);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
		font-family: monospace;
	}
	
	.empty-message {
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--space-8);
	}
	
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.form-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.form-group label {
		font-size: var(--size-sm);
		font-weight: 500;
	}
	
	.form-hint {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
	}
</style>
