<script lang="ts">
	import { page } from '$app/stores';
	import { Card, Button, Input, Modal, Tabs, Select, Badge, Textarea, HelpTooltip } from '$lib/components/ui';
	import { currentLanguage } from '$lib/stores';
	
	const languageId = $derived($page.params.id);
	
	let activeSection = $state<'scripts' | 'glyphs' | 'romanization'>('scripts');
	let selectedScriptId = $state<string>('');
	
	let scriptModalOpen = $state(false);
	let editingScript = $state<Script | null>(null);
	let scriptForm = $state({
		name: '',
		type: 'alphabet' as ScriptType,
		description: '',
		direction: 'ltr'
	});
	
	let glyphModalOpen = $state(false);
	let editingGlyph = $state<Glyph | null>(null);
	let glyphForm = $state({
		character: '',
		svgPath: '',
		unicodePoint: '',
		phonemeMapping: '',
		name: ''
	});
	
	let romanizationModalOpen = $state(false);
	let editingRule = $state<RomanizationRule | null>(null);
	let romanizationForm = $state({
		nativeForm: '',
		romanizedForm: '',
		environment: '',
		priority: 0
	});
	
	let testInput = $state('');
	let testOutput = $state('');
	
	let saving = $state(false);
	let deleteConfirmId = $state<string>('');
	
	type ScriptType = 'alphabet' | 'abjad' | 'abugida' | 'syllabary' | 'logographic' | 'featural' | 'mixed';
	
	interface Script {
		id: string;
		name: string;
		type: ScriptType;
		description?: string;
		direction?: string;
		glyphs?: Glyph[];
		romanizationRules?: RomanizationRule[];
	}
	
	interface Glyph {
		id: string;
		scriptId: string;
		character?: string;
		svgPath?: string;
		unicodePoint?: string;
		phonemeMapping?: string;
		name?: string;
		sortOrder?: number;
	}
	
	interface RomanizationRule {
		id: string;
		scriptId: string;
		nativeForm: string;
		romanizedForm: string;
		environment?: string;
		priority?: number;
	}
	
	const scripts = $derived(($currentLanguage?.scripts ?? []) as Script[]);
	const selectedScript = $derived(scripts.find(s => s.id === selectedScriptId));
	const glyphs = $derived((selectedScript?.glyphs ?? []) as Glyph[]);
	const romanizationRules = $derived((selectedScript?.romanizationRules ?? []) as RomanizationRule[]);
	
	$effect(() => {
		if (scripts.length > 0 && !selectedScriptId) {
			selectedScriptId = scripts[0].id;
		}
	});
	
	$effect(() => {
		if (scripts.length > 0 && selectedScriptId && !scripts.find(s => s.id === selectedScriptId)) {
			selectedScriptId = scripts[0]?.id ?? '';
		}
	});
	
	const scriptTypes: { value: ScriptType; label: string; description: string }[] = [
		{ value: 'alphabet', label: 'Alphabet', description: 'Consonants and vowels written separately' },
		{ value: 'abjad', label: 'Abjad', description: 'Only consonants written, vowels optional' },
		{ value: 'abugida', label: 'Abugida', description: 'Consonants with inherent vowels, modified by diacritics' },
		{ value: 'syllabary', label: 'Syllabary', description: 'Each symbol represents a syllable' },
		{ value: 'logographic', label: 'Logographic', description: 'Each symbol represents a word or morpheme' },
		{ value: 'featural', label: 'Featural', description: 'Symbols reflect phonetic features' },
		{ value: 'mixed', label: 'Mixed', description: 'Combination of multiple systems' }
	];
	
	const directionOptions = [
		{ value: 'ltr', label: 'Left to Right' },
		{ value: 'rtl', label: 'Right to Left' },
		{ value: 'ttb', label: 'Top to Bottom' },
		{ value: 'btt', label: 'Bottom to Top' }
	];
	
	function openScriptModal(script?: Script) {
		if (script) {
			editingScript = script;
			scriptForm = {
				name: script.name,
				type: script.type,
				description: script.description ?? '',
				direction: script.direction ?? 'ltr'
			};
		} else {
			editingScript = null;
			scriptForm = {
				name: '',
				type: 'alphabet',
				description: '',
				direction: 'ltr'
			};
		}
		scriptModalOpen = true;
	}
	
	async function saveScript() {
		saving = true;
		try {
			const payload = {
				name: scriptForm.name,
				type: scriptForm.type,
				description: scriptForm.description || null,
				direction: scriptForm.direction
			};
			
			if (editingScript) {
				await fetch(`/api/languages/${languageId}/scripts/${editingScript.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				const response = await fetch(`/api/languages/${languageId}/scripts`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				const newScript = await response.json();
				selectedScriptId = newScript.id;
			}
			
			await currentLanguage.load(languageId);
			scriptModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteScript(id: string) {
		await fetch(`/api/languages/${languageId}/scripts/${id}`, { method: 'DELETE' });
		if (selectedScriptId === id) {
			selectedScriptId = scripts.filter(s => s.id !== id)[0]?.id ?? '';
		}
		await currentLanguage.load(languageId);
		deleteConfirmId = '';
	}
	
	function openGlyphModal(glyph?: Glyph) {
		if (glyph) {
			editingGlyph = glyph;
			glyphForm = {
				character: glyph.character ?? '',
				svgPath: glyph.svgPath ?? '',
				unicodePoint: glyph.unicodePoint ?? '',
				phonemeMapping: glyph.phonemeMapping ?? '',
				name: glyph.name ?? ''
			};
		} else {
			editingGlyph = null;
			glyphForm = {
				character: '',
				svgPath: '',
				unicodePoint: '',
				phonemeMapping: '',
				name: ''
			};
		}
		glyphModalOpen = true;
	}
	
	async function saveGlyph() {
		if (!selectedScriptId) return;
		
		saving = true;
		try {
			const payload = {
				character: glyphForm.character || null,
				svgPath: glyphForm.svgPath || null,
				unicodePoint: glyphForm.unicodePoint || null,
				phonemeMapping: glyphForm.phonemeMapping || null,
				name: glyphForm.name || null,
				sortOrder: editingGlyph?.sortOrder ?? glyphs.length
			};
			
			if (editingGlyph) {
				await fetch(`/api/languages/${languageId}/scripts/${selectedScriptId}/glyphs/${editingGlyph.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				await fetch(`/api/languages/${languageId}/scripts/${selectedScriptId}/glyphs`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			
			await currentLanguage.load(languageId);
			glyphModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteGlyph(id: string) {
		if (!selectedScriptId) return;
		await fetch(`/api/languages/${languageId}/scripts/${selectedScriptId}/glyphs/${id}`, { method: 'DELETE' });
		await currentLanguage.load(languageId);
		deleteConfirmId = '';
	}
	
	function openRomanizationModal(rule?: RomanizationRule) {
		if (rule) {
			editingRule = rule;
			romanizationForm = {
				nativeForm: rule.nativeForm,
				romanizedForm: rule.romanizedForm,
				environment: rule.environment ?? '',
				priority: rule.priority ?? 0
			};
		} else {
			editingRule = null;
			romanizationForm = {
				nativeForm: '',
				romanizedForm: '',
				environment: '',
				priority: romanizationRules.length
			};
		}
		romanizationModalOpen = true;
	}
	
	async function saveRomanization() {
		if (!selectedScriptId) return;
		
		saving = true;
		try {
			const payload = {
				nativeForm: romanizationForm.nativeForm,
				romanizedForm: romanizationForm.romanizedForm,
				environment: romanizationForm.environment || null,
				priority: romanizationForm.priority
			};
			
			if (editingRule) {
				await fetch(`/api/languages/${languageId}/scripts/${selectedScriptId}/romanization/${editingRule.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				await fetch(`/api/languages/${languageId}/scripts/${selectedScriptId}/romanization`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			
			await currentLanguage.load(languageId);
			romanizationModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteRomanization(id: string) {
		if (!selectedScriptId) return;
		await fetch(`/api/languages/${languageId}/scripts/${selectedScriptId}/romanization/${id}`, { method: 'DELETE' });
		await currentLanguage.load(languageId);
		deleteConfirmId = '';
	}
	
	function applyRomanization() {
		if (!testInput.trim()) {
			testOutput = '';
			return;
		}
		
		let result = testInput;
		const sortedRules = [...romanizationRules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
		
		for (const rule of sortedRules) {
			result = result.replaceAll(rule.nativeForm, rule.romanizedForm);
		}
		
		testOutput = result;
	}
	
	const sections = [
		{ id: 'scripts', label: 'Writing Systems' },
		{ id: 'glyphs', label: 'Glyphs' },
		{ id: 'romanization', label: 'Romanization' }
	];
</script>

<div class="scripts-page">
	<Tabs 
		tabs={sections} 
		activeTab={activeSection} 
		ontabchange={(id) => activeSection = id as typeof activeSection}
	>
		{#if activeSection === 'scripts'}
			<div class="section">
				<div class="section-header">
					<h2>Writing Systems</h2>
					<Button variant="primary" onclick={() => openScriptModal()}>Add Script</Button>
				</div>
				
				<Card>
					<p class="section-desc">
						Define writing systems for your language. Each script can have its own set of glyphs
						and romanization rules.
					</p>
				</Card>
				
				<div class="scripts-grid">
					{#each scripts as script}
						<Card>
							<div class="script-header">
								<h3 class="script-name">{script.name}</h3>
								<Badge label={script.type} />
							</div>
							
							{#if script.description}
								<p class="script-desc">{script.description}</p>
							{/if}
							
							<div class="script-meta">
								<span class="meta-item">
									<span class="meta-label">Direction:</span>
									{script.direction === 'rtl' ? 'Right to Left' : 
									 script.direction === 'ttb' ? 'Top to Bottom' : 'Left to Right'}
								</span>
								<span class="meta-item">
									<span class="meta-label">Glyphs:</span>
									{script.glyphs?.length ?? 0}
								</span>
							</div>
							
							<div class="script-actions">
								<Button size="sm" variant="ghost" onclick={() => { selectedScriptId = script.id; activeSection = 'glyphs'; }}>
									View Glyphs
								</Button>
								<Button size="sm" variant="ghost" onclick={() => openScriptModal(script)}>Edit</Button>
								<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `script-${script.id}`}>Delete</Button>
							</div>
						</Card>
					{:else}
						<Card>
							<p class="empty-message">No writing systems defined yet. Click "Add Script" to create one.</p>
						</Card>
					{/each}
				</div>
				
				<Card title="Script Types Reference">
					<div class="type-reference">
						{#each scriptTypes as type}
							<div class="type-item">
								<span class="type-name">{type.label}</span>
								<span class="type-desc">{type.description}</span>
							</div>
						{/each}
					</div>
				</Card>
			</div>
		{:else if activeSection === 'glyphs'}
			<div class="section">
				<div class="section-header">
					<h2>Glyphs</h2>
					<div class="header-controls">
						{#if scripts.length > 1}
							<Select 
								options={scripts.map(s => ({ value: s.id, label: s.name }))}
								bind:value={selectedScriptId}
							/>
						{/if}
						<Button variant="primary" onclick={() => openGlyphModal()} disabled={!selectedScriptId}>
							Add Glyph
						</Button>
					</div>
				</div>
				
				{#if !selectedScript}
					<Card>
						<p class="empty-message">Select a script or create one first.</p>
					</Card>
				{:else}
					<Card title="{selectedScript.name} - Glyphs">
						<div class="glyph-grid">
							{#each glyphs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) as glyph}
								<button type="button" class="glyph-item" onclick={() => openGlyphModal(glyph)}>
									{#if glyph.character}
										<span class="glyph-char">{glyph.character}</span>
									{:else if glyph.svgPath}
										<svg class="glyph-svg" viewBox="0 0 100 100">
											<path d={glyph.svgPath} fill="currentColor" />
										</svg>
									{:else}
										<span class="glyph-placeholder">?</span>
									{/if}
									{#if glyph.phonemeMapping}
										<span class="glyph-mapping">/{glyph.phonemeMapping}/</span>
									{/if}
									{#if glyph.name}
										<span class="glyph-name">{glyph.name}</span>
									{/if}
								</button>
							{:else}
								<p class="empty-inline">No glyphs defined yet.</p>
							{/each}
						</div>
					</Card>
				{/if}
			</div>
		{:else if activeSection === 'romanization'}
			<div class="section">
				<div class="section-header">
					<h2>Romanization Rules</h2>
					<div class="header-controls">
						{#if scripts.length > 1}
							<Select 
								options={scripts.map(s => ({ value: s.id, label: s.name }))}
								bind:value={selectedScriptId}
							/>
						{/if}
						<Button variant="primary" onclick={() => openRomanizationModal()} disabled={!selectedScriptId}>
							Add Rule
						</Button>
					</div>
				</div>
				
				{#if !selectedScript}
					<Card>
						<p class="empty-message">Select a script or create one first.</p>
					</Card>
				{:else}
					<Card title="Test Romanization">
						<div class="romanization-tester">
							<div class="tester-row">
								<Input 
									bind:value={testInput} 
									placeholder="Enter text in native script..."
									onkeydown={(e) => e.key === 'Enter' && applyRomanization()}
								/>
								<Button onclick={applyRomanization}>Convert</Button>
							</div>
							{#if testOutput}
								<div class="tester-result">
									<span class="result-label">Romanized:</span>
									<span class="result-value">{testOutput}</span>
								</div>
							{/if}
						</div>
					</Card>
					
					<Card title="Romanization Rules">
						<div class="rule-list">
							{#each romanizationRules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)) as rule}
								<div class="rule-item">
									<div class="rule-mapping">
										<span class="rule-native">{rule.nativeForm}</span>
										<span class="rule-arrow">→</span>
										<span class="rule-roman">{rule.romanizedForm}</span>
									</div>
									{#if rule.environment}
										<span class="rule-env">/ {rule.environment}</span>
									{/if}
									<span class="rule-priority">Priority: {rule.priority ?? 0}</span>
									<div class="rule-actions">
										<Button size="sm" variant="ghost" onclick={() => openRomanizationModal(rule)}>Edit</Button>
										<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `roman-${rule.id}`}>Delete</Button>
									</div>
								</div>
							{:else}
								<p class="empty-inline">No romanization rules defined yet.</p>
							{/each}
						</div>
					</Card>
				{/if}
			</div>
		{/if}
	</Tabs>
</div>

<Modal 
	bind:open={scriptModalOpen} 
	title={editingScript ? 'Edit Script' : 'Add Script'}
	size="md"
	onclose={() => scriptModalOpen = false}
>
	<div class="form">
		<div class="form-group">
			<label for="script-name">Script Name</label>
			<Input id="script-name" bind:value={scriptForm.name} placeholder="e.g. Tengwar, Runic" />
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="script-type">Type <HelpTooltip key="scriptType" inline /></label>
				<Select 
					id="script-type" 
					options={scriptTypes.map(t => ({ value: t.value, label: t.label }))} 
					bind:value={scriptForm.type}
				/>
			</div>
			<div class="form-group">
				<label for="script-direction">Direction <HelpTooltip key="scriptDirection" inline /></label>
				<Select id="script-direction" options={directionOptions} bind:value={scriptForm.direction} />
			</div>
		</div>
		
		<div class="form-group">
			<label for="script-desc">Description</label>
			<Textarea id="script-desc" bind:value={scriptForm.description} placeholder="Describe this writing system..." rows={3} />
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => scriptModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveScript} loading={saving} disabled={!scriptForm.name}>
			{editingScript ? 'Update' : 'Add'} Script
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={glyphModalOpen} 
	title={editingGlyph ? 'Edit Glyph' : 'Add Glyph'}
	size="md"
	onclose={() => glyphModalOpen = false}
>
	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="glyph-char">Character <HelpTooltip key="glyphCharacter" inline /></label>
				<Input id="glyph-char" bind:value={glyphForm.character} placeholder="The glyph character" />
				<span class="form-hint">For Unicode characters or custom fonts</span>
			</div>
			<div class="form-group">
				<label for="glyph-name">Name</label>
				<Input id="glyph-name" bind:value={glyphForm.name} placeholder="e.g. 'a', 'ka', 'sun'" />
			</div>
		</div>
		
		<div class="form-group">
			<label for="glyph-mapping">Phoneme Mapping <HelpTooltip key="glyphPhoneme" inline /></label>
			<Input id="glyph-mapping" bind:value={glyphForm.phonemeMapping} placeholder="e.g. k, ka, ŋ" />
			<span class="form-hint">What sound(s) this glyph represents</span>
		</div>
		
		<div class="form-group">
			<label for="glyph-unicode">Unicode Point (optional)</label>
			<Input id="glyph-unicode" bind:value={glyphForm.unicodePoint} placeholder="e.g. U+0041" />
		</div>
		
		<div class="form-group">
			<label for="glyph-svg">SVG Path (optional)</label>
			<Textarea 
				id="glyph-svg" 
				bind:value={glyphForm.svgPath} 
				placeholder="M10 10 L90 10 L90 90 L10 90 Z"
				rows={3}
			/>
			<span class="form-hint">For custom-drawn glyphs. Use path data for a 100x100 viewBox.</span>
		</div>
		
		{#if glyphForm.svgPath}
			<div class="glyph-preview">
				<span class="preview-label">Preview:</span>
				<svg viewBox="0 0 100 100" width="80" height="80">
					<path d={glyphForm.svgPath} fill="currentColor" />
				</svg>
			</div>
		{/if}
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => glyphModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveGlyph} loading={saving} disabled={!glyphForm.character && !glyphForm.svgPath}>
			{editingGlyph ? 'Update' : 'Add'} Glyph
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={romanizationModalOpen} 
	title={editingRule ? 'Edit Romanization Rule' : 'Add Romanization Rule'}
	size="md"
	onclose={() => romanizationModalOpen = false}
>
	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="roman-native">Native Form <HelpTooltip key="romanNative" inline /></label>
				<Input id="roman-native" bind:value={romanizationForm.nativeForm} placeholder="Characters in native script" />
			</div>
			<div class="form-group">
				<label for="roman-latin">Romanized Form <HelpTooltip key="romanLatin" inline /></label>
				<Input id="roman-latin" bind:value={romanizationForm.romanizedForm} placeholder="Latin script equivalent" />
			</div>
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="roman-env">Environment (optional)</label>
				<Input id="roman-env" bind:value={romanizationForm.environment} placeholder="e.g. word-final" />
			</div>
			<div class="form-group">
				<label for="roman-priority">Priority</label>
				<Input id="roman-priority" type="number" bind:value={romanizationForm.priority} />
				<span class="form-hint">Higher priority rules are applied first</span>
			</div>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => romanizationModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveRomanization} loading={saving} disabled={!romanizationForm.nativeForm}>
			{editingRule ? 'Update' : 'Add'} Rule
		</Button>
	{/snippet}
</Modal>

<Modal 
	open={deleteConfirmId !== ''}
	title="Confirm Delete"
	size="sm"
	onclose={() => deleteConfirmId = ''}
>
	<p>Are you sure you want to delete this item? This action cannot be undone.</p>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => deleteConfirmId = ''}>Cancel</Button>
		<Button 
			variant="danger" 
			onclick={() => {
				if (deleteConfirmId?.startsWith('script-')) {
					deleteScript(deleteConfirmId.replace('script-', ''));
				} else if (deleteConfirmId?.startsWith('glyph-')) {
					deleteGlyph(deleteConfirmId.replace('glyph-', ''));
				} else if (deleteConfirmId?.startsWith('roman-')) {
					deleteRomanization(deleteConfirmId.replace('roman-', ''));
				}
			}}
		>
			Delete
		</Button>
	{/snippet}
</Modal>

<style>
	.scripts-page {
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
	
	.header-controls {
		display: flex;
		gap: var(--space-3);
		align-items: center;
	}
	
	.section-desc {
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		margin: 0;
	}
	
	.scripts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}
	
	.script-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}
	
	.script-name {
		font-size: var(--size-md);
		font-weight: 600;
		margin: 0;
	}
	
	.script-desc {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: var(--space-2) 0;
	}
	
	.script-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		font-size: var(--size-sm);
		margin: var(--space-3) 0;
	}
	
	.meta-label {
		color: var(--color-text-tertiary);
		margin-right: var(--space-1);
	}
	
	.script-actions {
		display: flex;
		gap: var(--space-1);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}
	
	.glyph-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: var(--space-3);
	}
	
	.glyph-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border: none;
		border-radius: var(--radius-md);
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.glyph-item:hover {
		background: var(--color-bg-hover);
	}
	
	.glyph-char {
		font-size: var(--size-2xl);
		line-height: 1;
	}
	
	.glyph-svg {
		width: 40px;
		height: 40px;
	}
	
	.glyph-placeholder {
		font-size: var(--size-xl);
		color: var(--color-text-tertiary);
	}
	
	.glyph-mapping {
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
		font-family: monospace;
		margin-top: var(--space-1);
	}
	
	.glyph-name {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
	}
	
	.type-reference {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.type-item {
		display: flex;
		gap: var(--space-2);
		font-size: var(--size-sm);
	}
	
	.type-name {
		font-weight: 500;
		min-width: 100px;
	}
	
	.type-desc {
		color: var(--color-text-secondary);
	}
	
	.romanization-tester {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.tester-row {
		display: flex;
		gap: var(--space-2);
	}
	
	.tester-row :global(.input-wrapper) {
		flex: 1;
	}
	
	.tester-result {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.result-label {
		font-weight: 500;
	}
	
	.result-value {
		font-family: monospace;
	}
	
	.rule-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.rule-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		flex-wrap: wrap;
	}
	
	.rule-mapping {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-family: monospace;
		font-size: var(--size-md);
	}
	
	.rule-native {
		font-weight: 500;
	}
	
	.rule-arrow {
		color: var(--color-text-tertiary);
	}
	
	.rule-env {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.rule-priority {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
		margin-left: auto;
	}
	
	.rule-actions {
		display: flex;
		gap: var(--space-1);
	}
	
	.empty-message,
	.empty-inline {
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
	
	.glyph-preview {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.preview-label {
		font-size: var(--size-sm);
		font-weight: 500;
	}
</style>
