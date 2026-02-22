<script lang="ts">
	import { page } from '$app/stores';
	import { Card, Button, Input, Modal, Select, Badge, Textarea, IPAKeyboard, HelpTooltip, Checkbox } from '$lib/components/ui';
	import { runQuery, runMutation, getUserId } from '$lib/convex';
	import { onMount } from 'svelte';
	
	const languageId = $derived($page.params.id);
	
	let searchQuery = $state('');
	let filterWordClass = $state('');
	let filterTag = $state('');
	
	let wordModalOpen = $state(false);
	let editingWord = $state<Word | null>(null);
	let wordForm = $state({
		lemma: '',
		ipa: '',
		romanization: '',
		wordClass: 'noun' as WordClass,
		definitions: '',
		etymology: '',
		morphologicalAnalysis: '',
		notes: '',
		tags: '',
		semanticFields: '',
		usageNotes: ''
	});
	
	let relationModalOpen = $state(false);
	let newRelation = $state({
		toWordId: '',
		relationType: 'synonym' as RelationType
	});
	let selectedWordForRelation = $state<Word | null>(null);
	
	let showIPAKeyboard = $state(false);
	let saving = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	let selectedWordIds = $state<Set<string>>(new Set());
	let phonemes = $state<Array<{ symbol?: string; ipa?: string }>>([]);
	
	type WordClass = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'determiner' | 'preposition' | 'postposition' | 'conjunction' | 'interjection' | 'particle' | 'numeral' | 'classifier' | 'auxiliary' | 'copula' | 'other';
	type RelationType = 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'meronym' | 'holonym' | 'derived' | 'compound' | 'cognate' | 'doublet';
	
	interface Definition {
		meaning: string;
		partOfSpeech?: string;
		examples?: string[];
		register?: string;
		domain?: string;
	}
	
	interface Etymology {
		origin?: string;
		protoForm?: string;
		borrowedFrom?: string;
		notes?: string;
	}
	
	interface Word {
		_id: string;
		lemma: string;
		ipa?: string;
		romanization?: string;
		wordClass: WordClass;
		definitions?: Definition[];
		etymology?: Etymology;
		morphologicalAnalysis?: string;
		notes?: string;
		tags?: string[];
		semanticFields?: string[];
		usageNotes?: string;
		inflectedForms?: InflectedForm[];
		relationsFrom?: WordRelation[];
		relationsTo?: WordRelation[];
	}
	
	interface InflectedForm {
		_id: string;
		form: string;
		ipa?: string;
		grammaticalFeatures?: Record<string, string>;
		isIrregular?: boolean;
	}
	
	interface WordRelation {
		_id: string;
		fromWordId: string;
		toWordId: string;
		relationType: RelationType;
		notes?: string;
		fromWord?: Word;
		toWord?: Word;
	}
	
	let words = $state<Word[]>([]);
	let loading = $state(true);

	const selectedWordsCount = $derived(selectedWordIds.size);
	const normalizedPhonemeInventory = $derived.by(() => {
		const inventory = new Set<string>();
		for (const phoneme of phonemes) {
			const symbol = phoneme.symbol?.trim().toLocaleLowerCase();
			const ipa = phoneme.ipa?.trim().toLocaleLowerCase();
			if (symbol) inventory.add(symbol);
			if (ipa) inventory.add(ipa);
		}
		return Array.from(inventory).sort((a, b) => b.length - a.length);
	});
	const lemmaValidationError = $derived.by(() => {
		const lemma = wordForm.lemma.trim();
		if (!lemma) return undefined;
		if (!/^[\p{L}\p{M}]+$/u.test(lemma)) {
			return 'Lemma must contain letters only.';
		}

		if (normalizedPhonemeInventory.length === 0) return undefined;

		let remaining = lemma.toLocaleLowerCase();
		while (remaining.length > 0) {
			let matched = false;
			for (const phonemeSymbol of normalizedPhonemeInventory) {
				if (remaining.startsWith(phonemeSymbol)) {
					remaining = remaining.slice(phonemeSymbol.length);
					matched = true;
					break;
				}
			}
			if (!matched) {
				return `Lemma contains symbol not in your phoneme inventory: "${remaining[0]}".`;
			}
		}

		return undefined;
	});
	
	onMount(async () => {
		await loadData();
	});
	
	async function loadData() {
		loading = true;
		try {
			const [wordsData, phonemeData] = await Promise.all([
				runQuery<Word[]>('lexicon:getWords', { languageId }),
				runQuery<Array<{ symbol?: string; ipa?: string }>>('phonology:getPhonemes', { languageId })
			]);
			words = wordsData ?? [];
			phonemes = phonemeData ?? [];
		} catch (e) {
			console.error('Failed to load lexicon data:', e);
		} finally {
			loading = false;
		}
	}
	
	const filteredWords = $derived.by(() => {
		let result = [...words];
		
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(w => 
				w.lemma.toLowerCase().includes(query) ||
				w.ipa?.toLowerCase().includes(query) ||
				w.definitions?.some(d => d.meaning.toLowerCase().includes(query))
			);
		}
		
		if (filterWordClass) {
			result = result.filter(w => w.wordClass === filterWordClass);
		}
		
		if (filterTag) {
			result = result.filter(w => w.tags?.includes(filterTag));
		}
		
		return result.sort((a, b) => a.lemma.localeCompare(b.lemma));
	});

	const allFilteredSelected = $derived(filteredWords.length > 0 && filteredWords.every(word => selectedWordIds.has(word._id)));
	
	const allTags = $derived.by(() => {
		const tagSet = new Set<string>();
		words.forEach(w => w.tags?.forEach(t => tagSet.add(t)));
		return Array.from(tagSet).sort();
	});
	
	const wordClasses: { value: WordClass; label: string }[] = [
		{ value: 'noun', label: 'Noun' },
		{ value: 'verb', label: 'Verb' },
		{ value: 'adjective', label: 'Adjective' },
		{ value: 'adverb', label: 'Adverb' },
		{ value: 'pronoun', label: 'Pronoun' },
		{ value: 'determiner', label: 'Determiner' },
		{ value: 'preposition', label: 'Preposition' },
		{ value: 'postposition', label: 'Postposition' },
		{ value: 'conjunction', label: 'Conjunction' },
		{ value: 'interjection', label: 'Interjection' },
		{ value: 'particle', label: 'Particle' },
		{ value: 'numeral', label: 'Numeral' },
		{ value: 'classifier', label: 'Classifier' },
		{ value: 'auxiliary', label: 'Auxiliary' },
		{ value: 'copula', label: 'Copula' },
		{ value: 'other', label: 'Other' }
	];
	
	const relationTypes: { value: RelationType; label: string }[] = [
		{ value: 'synonym', label: 'Synonym' },
		{ value: 'antonym', label: 'Antonym' },
		{ value: 'hypernym', label: 'Hypernym (more general)' },
		{ value: 'hyponym', label: 'Hyponym (more specific)' },
		{ value: 'meronym', label: 'Meronym (part of)' },
		{ value: 'holonym', label: 'Holonym (whole of)' },
		{ value: 'derived', label: 'Derived from' },
		{ value: 'compound', label: 'Compound of' },
		{ value: 'cognate', label: 'Cognate' },
		{ value: 'doublet', label: 'Doublet' }
	];
	
	function openWordModal(word?: Word) {
		if (word) {
			editingWord = word;
			wordForm = {
				lemma: word.lemma,
				ipa: word.ipa ?? '',
				romanization: word.romanization ?? '',
				wordClass: word.wordClass,
				definitions: word.definitions?.map(d => d.meaning).join('\n') ?? '',
				etymology: word.etymology?.origin ?? '',
				morphologicalAnalysis: word.morphologicalAnalysis ?? '',
				notes: word.notes ?? '',
				tags: word.tags?.join(', ') ?? '',
				semanticFields: word.semanticFields?.join(', ') ?? '',
				usageNotes: word.usageNotes ?? ''
			};
		} else {
			editingWord = null;
			wordForm = {
				lemma: '',
				ipa: '',
				romanization: '',
				wordClass: 'noun',
				definitions: '',
				etymology: '',
				morphologicalAnalysis: '',
				notes: '',
				tags: '',
				semanticFields: '',
				usageNotes: ''
			};
		}
		wordModalOpen = true;
	}
	
	function handleIPASelect(symbol: string) {
		wordForm.ipa += symbol;
	}
	
	function parseDefinitions(text: string): Definition[] {
		return text.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.map(meaning => ({ meaning }));
	}
	
	async function saveWord() {
		if (lemmaValidationError) return;
		saving = true;
		try {
			const payload = {
				userId: getUserId(),
				languageId,
				lemma: wordForm.lemma,
				ipa: wordForm.ipa || undefined,
				romanization: wordForm.romanization || undefined,
				wordClass: wordForm.wordClass,
				definitions: wordForm.definitions ? parseDefinitions(wordForm.definitions) : undefined,
				etymology: wordForm.etymology ? { origin: wordForm.etymology } : undefined,
				morphologicalAnalysis: wordForm.morphologicalAnalysis || undefined,
				notes: wordForm.notes || undefined,
				tags: wordForm.tags ? wordForm.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
				semanticFields: wordForm.semanticFields ? wordForm.semanticFields.split(',').map(s => s.trim()).filter(Boolean) : undefined,
				usageNotes: wordForm.usageNotes || undefined
			};
			
			if (editingWord) {
				await runMutation('lexicon:updateWord', {
					userId: payload.userId,
					wordId: editingWord._id,
					lemma: payload.lemma,
					ipa: payload.ipa,
					romanization: payload.romanization,
					wordClass: payload.wordClass,
					definitions: payload.definitions,
					etymology: payload.etymology,
					morphologicalAnalysis: payload.morphologicalAnalysis,
					notes: payload.notes,
					tags: payload.tags,
					semanticFields: payload.semanticFields,
					usageNotes: payload.usageNotes
				});
			} else {
				await runMutation('lexicon:createWord', payload);
			}
			
			await loadData();
			wordModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteWord(id: string) {
		await runMutation('lexicon:deleteWord', {
			userId: getUserId(),
			wordId: id
		});
		await loadData();
		deleteConfirmId = null;
	}

	function toggleWordSelected(wordId: string, checked: boolean) {
		const next = new Set(selectedWordIds);
		if (checked) {
			next.add(wordId);
		} else {
			next.delete(wordId);
		}
		selectedWordIds = next;
	}

	function toggleSelectAllFiltered(checked: boolean) {
		if (!checked) {
			selectedWordIds = new Set();
			return;
		}
		selectedWordIds = new Set(filteredWords.map(word => word._id));
	}

	async function deleteSelectedWords() {
		if (selectedWordIds.size === 0) return;
		saving = true;
		try {
			for (const wordId of selectedWordIds) {
				await runMutation('lexicon:deleteWord', {
					userId: getUserId(),
					wordId
				});
			}
			selectedWordIds = new Set();
			await loadData();
		} finally {
			saving = false;
		}
	}
	
	function openRelationModal(word: Word) {
		selectedWordForRelation = word;
		newRelation = {
			toWordId: '',
			relationType: 'synonym'
		};
		relationModalOpen = true;
	}
	
	async function saveRelation() {
		if (!selectedWordForRelation || !newRelation.toWordId) return;
		
		saving = true;
		try {
			await runMutation('lexicon:createWordRelationship', {
				userId: getUserId(),
				fromWordId: selectedWordForRelation._id,
				toWordId: newRelation.toWordId,
				relationType: newRelation.relationType
			});
			
			await loadData();
			relationModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	function getRelatedWords(word: Word): { relation: string; word: Word }[] {
		const related: { relation: string; word: Word }[] = [];
		
		word.relationsFrom?.forEach(rel => {
			const targetWord = words.find(w => w._id === rel.toWordId);
			if (targetWord) {
				related.push({ relation: rel.relationType, word: targetWord });
			}
		});
		
		word.relationsTo?.forEach(rel => {
			const sourceWord = words.find(w => w._id === rel.fromWordId);
			if (sourceWord) {
				const inverseRelation = getInverseRelation(rel.relationType);
				related.push({ relation: inverseRelation, word: sourceWord });
			}
		});
		
		return related;
	}
	
	function getInverseRelation(type: RelationType): string {
		const inverses: Record<RelationType, string> = {
			synonym: 'synonym',
			antonym: 'antonym',
			hypernym: 'hyponym',
			hyponym: 'hypernym',
			meronym: 'holonym',
			holonym: 'meronym',
			derived: 'source of',
			compound: 'part of compound',
			cognate: 'cognate',
			doublet: 'doublet'
		};
		return inverses[type] || type;
	}
</script>

<div class="lexicon-page">
	<div class="page-header">
		<h2>Lexicon</h2>
		<div class="header-stats">
			<Badge label="{words.length} words" />
		</div>
		<Button variant="primary" onclick={() => openWordModal()}>Add Word</Button>
	</div>
	
	{#if loading}
		<Card>
			<p class="loading-message">Loading lexicon...</p>
		</Card>
	{:else}
		<Card>
			<div class="search-bar">
				<div class="search-input">
					<Input 
						type="search"
						bind:value={searchQuery} 
						placeholder="Search words, meanings..." 
					/>
				</div>
				<div class="filter-controls">
					<Select 
						options={[{ value: '', label: 'All word classes' }, ...wordClasses]}
						bind:value={filterWordClass}
					/>
					{#if allTags.length > 0}
						<Select 
							options={[{ value: '', label: 'All tags' }, ...allTags.map(t => ({ value: t, label: t }))]}
							bind:value={filterTag}
						/>
					{/if}
				</div>
				<div class="selection-controls">
					<Checkbox checked={allFilteredSelected} onchange={(event) => toggleSelectAllFiltered((event.currentTarget as HTMLInputElement).checked)} label="Select all" />
					{#if selectedWordsCount > 0}
						<span class="selection-count">{selectedWordsCount} selected</span>
						<Button size="sm" variant="danger" onclick={deleteSelectedWords} loading={saving}>Delete Selected</Button>
					{/if}
				</div>
			</div>
		</Card>
		
		<div class="word-list">
			{#each filteredWords as word}
				<Card>
					<div class="word-header">
						<div class="word-title">
							<Checkbox checked={selectedWordIds.has(word._id)} onchange={(event) => toggleWordSelected(word._id, (event.currentTarget as HTMLInputElement).checked)} />
							<span class="word-lemma">{word.lemma}</span>
							{#if word.ipa}
								<span class="word-ipa">/{word.ipa}/</span>
							{/if}
							<Badge label={word.wordClass} />
						</div>
						<div class="word-actions">
							<Button size="sm" variant="ghost" onclick={() => openRelationModal(word)}>Link</Button>
							<Button size="sm" variant="ghost" onclick={() => openWordModal(word)}>Edit</Button>
							<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = word._id}>Delete</Button>
						</div>
					</div>
					
					{#if word.romanization}
						<div class="word-romanization">
							Romanization: {word.romanization}
						</div>
					{/if}
					
					{#if word.definitions?.length}
						<div class="word-definitions">
							{#each word.definitions as def, i}
								<div class="definition">
									<span class="def-number">{i + 1}.</span>
									<span class="def-meaning">{def.meaning}</span>
								</div>
							{/each}
						</div>
					{/if}
					
					{#if word.morphologicalAnalysis}
						<div class="word-analysis">
							<span class="analysis-label">Analysis:</span>
							<code>{word.morphologicalAnalysis}</code>
						</div>
					{/if}
					
					{#if word.etymology?.origin}
						<div class="word-etymology">
							<span class="etymology-label">Etymology:</span>
							{word.etymology.origin}
						</div>
					{/if}
					
					{#if word.tags?.length}
						<div class="word-tags">
							{#each word.tags as tag}
								<Badge label={tag} />
							{/each}
						</div>
					{/if}
					
					{@const related = getRelatedWords(word)}
					{#if related.length > 0}
						<div class="word-relations">
							<span class="relations-label">Related:</span>
							{#each related as rel}
								<span class="relation-item">
									<span class="relation-type">{rel.relation}:</span>
									<span class="relation-word">{rel.word.lemma}</span>
								</span>
							{/each}
						</div>
					{/if}
				</Card>
			{:else}
				<Card>
					<p class="empty-message">
						{#if searchQuery || filterWordClass || filterTag}
							No words match your search criteria.
						{:else}
							No words in the lexicon yet. Click "Add Word" to get started.
						{/if}
					</p>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<Modal 
	bind:open={wordModalOpen} 
	title={editingWord ? 'Edit Word' : 'Add Word'}
	size="lg"
	onclose={() => wordModalOpen = false}
>
	<div class="form">
		<div class="form-row three-col">
			<div class="form-group">
				<label for="word-lemma">Lemma <HelpTooltip key="wordLemma" inline /></label>
				<Input id="word-lemma" bind:value={wordForm.lemma} placeholder="Enter word..." error={lemmaValidationError} />
				{#if normalizedPhonemeInventory.length > 0}
					<span class="form-hint">Allowed symbols from phonology: {normalizedPhonemeInventory.join(', ')}</span>
				{/if}
			</div>
			<div class="form-group">
				<label for="word-ipa">IPA Pronunciation <HelpTooltip key="wordIPA" inline /></label>
				<div class="ipa-input-group">
					<Input id="word-ipa" bind:value={wordForm.ipa} placeholder="/.../" />
					<Button size="sm" variant="ghost" onclick={() => showIPAKeyboard = !showIPAKeyboard}>
						IPA
					</Button>
				</div>
			</div>
			<div class="form-group">
				<label for="word-class">Word Class</label>
				<Select id="word-class" options={wordClasses} bind:value={wordForm.wordClass} />
			</div>
		</div>
		
		{#if showIPAKeyboard}
			<div class="form-group">
				<IPAKeyboard onselect={handleIPASelect} />
			</div>
		{/if}
		
		<div class="form-group">
			<label for="word-roman">Romanization</label>
			<Input id="word-roman" bind:value={wordForm.romanization} placeholder="Latin script representation" />
		</div>
		
		<div class="form-group">
			<label for="word-definitions">Definitions <HelpTooltip key="wordDefinitions" inline /></label>
			<Textarea 
				id="word-definitions" 
				bind:value={wordForm.definitions} 
				placeholder="Primary meaning&#10;Secondary meaning&#10;..."
				rows={4}
			/>
			<span class="form-hint">One per line</span>
		</div>
		
		<div class="form-group">
			<label for="word-morphology">Morphological Analysis <HelpTooltip key="wordMorphology" inline /></label>
			<Input 
				id="word-morphology" 
				bind:value={wordForm.morphologicalAnalysis} 
				placeholder="e.g. run-PAST-3SG" 
			/>
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="word-etymology">Etymology <HelpTooltip key="wordEtymology" inline /></label>
				<Input 
					id="word-etymology" 
					bind:value={wordForm.etymology} 
					placeholder="Origin of the word..." 
				/>
			</div>
			<div class="form-group">
				<label for="word-tags">Tags (comma-separated)</label>
				<Input 
					id="word-tags" 
					bind:value={wordForm.tags} 
					placeholder="archaic, formal, slang..." 
				/>
			</div>
		</div>
		
		<div class="form-group">
			<label for="word-semantic">Semantic Fields (comma-separated)</label>
			<Input 
				id="word-semantic" 
				bind:value={wordForm.semanticFields} 
				placeholder="body, family, nature..." 
			/>
		</div>
		
		<div class="form-group">
			<label for="word-notes">Notes</label>
			<Textarea 
				id="word-notes" 
				bind:value={wordForm.notes} 
				placeholder="Additional notes..."
				rows={2}
			/>
		</div>
		
		<div class="form-group">
			<label for="word-usage">Usage Notes</label>
			<Textarea 
				id="word-usage" 
				bind:value={wordForm.usageNotes} 
				placeholder="How this word is typically used..."
				rows={2}
			/>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => wordModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveWord} loading={saving} disabled={!wordForm.lemma || !!lemmaValidationError}>
			{editingWord ? 'Update' : 'Add'} Word
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={relationModalOpen} 
	title="Add Word Relationship"
	size="md"
	onclose={() => relationModalOpen = false}
>
	<div class="form">
		{#if selectedWordForRelation}
			<p class="relation-source">
				Adding relationship from: <strong>{selectedWordForRelation.lemma}</strong>
			</p>
		{/if}
		
		<div class="form-group">
			<label for="relation-type">Relationship Type <HelpTooltip key="wordRelationType" inline /></label>
			<Select id="relation-type" options={relationTypes} bind:value={newRelation.relationType} />
		</div>
		
		<div class="form-group">
			<label for="relation-target">Target Word</label>
			<Select 
				id="relation-target"
				options={words.filter(w => w._id !== selectedWordForRelation?._id).map(w => ({ 
					value: w._id, 
					label: `${w.lemma} (${w.wordClass})`
				}))}
				bind:value={newRelation.toWordId}
				placeholder="Select a word..."
			/>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => relationModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveRelation} loading={saving} disabled={!newRelation.toWordId}>
			Add Relationship
		</Button>
	{/snippet}
</Modal>

<Modal 
	open={deleteConfirmId !== null}
	title="Confirm Delete"
	size="sm"
	onclose={() => deleteConfirmId = null}
>
	<p>Are you sure you want to delete this word? This action cannot be undone.</p>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => deleteConfirmId = null}>Cancel</Button>
		<Button variant="danger" onclick={() => deleteConfirmId && deleteWord(deleteConfirmId)}>Delete</Button>
	{/snippet}
</Modal>

<style>
	.lexicon-page {
		max-width: 1000px;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	
	.page-header {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}
	
	.page-header h2 {
		font-size: var(--size-xl);
		font-weight: 600;
		margin: 0;
	}
	
	.header-stats {
		margin-right: auto;
	}
	
	.loading-message {
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--space-8);
	}
	
	.search-bar {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}
	
	.search-input {
		flex: 1;
		min-width: 250px;
	}
	
	.filter-controls {
		display: flex;
		gap: var(--space-2);
	}

	.selection-controls {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.selection-count {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.filter-controls :global(.select) {
		width: 160px;
	}
	
	.word-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.word-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-3);
	}
	
	.word-title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	
	.word-lemma {
		font-size: var(--size-lg);
		font-weight: 600;
	}
	
	.word-ipa {
		color: var(--color-text-secondary);
		font-family: monospace;
	}
	
	.word-actions {
		display: flex;
		gap: var(--space-1);
	}
	
	.word-romanization {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-2);
	}
	
	.word-definitions {
		margin: var(--space-3) 0;
	}
	
	.definition {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-1);
	}
	
	.def-number {
		color: var(--color-text-tertiary);
		font-size: var(--size-sm);
	}
	
	.def-meaning {
		font-size: var(--size-sm);
	}
	
	.word-analysis,
	.word-etymology {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: var(--space-2) 0;
	}
	
	.analysis-label,
	.etymology-label,
	.relations-label {
		font-weight: 500;
		margin-right: var(--space-2);
	}
	
	.word-analysis code {
		background: var(--color-bg-tertiary);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-family: monospace;
	}
	
	.word-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-top: var(--space-3);
	}
	
	.word-relations {
		font-size: var(--size-sm);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}
	
	.relation-item {
		margin-right: var(--space-3);
	}
	
	.relation-type {
		color: var(--color-text-tertiary);
	}
	
	.relation-word {
		font-weight: 500;
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
	
	.form-row.three-col {
		grid-template-columns: repeat(3, 1fr);
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
	
	.ipa-input-group {
		display: flex;
		gap: var(--space-2);
	}
	
	.ipa-input-group :global(.input-wrapper) {
		flex: 1;
	}
	
	.relation-source {
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-2);
	}
</style>
