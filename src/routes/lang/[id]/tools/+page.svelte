<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Card, Button, Input, Tabs, Select, Badge, HelpTooltip, Checkbox } from '$lib/components/ui';
	import { runQuery, runMutation, getUserId } from '$lib/convex';
	import { PhonotacticsEngine } from '$lib/engines/phonotactics';
	import { SoundChangeEngine, type SoundChange as SCType } from '$lib/engines/sound-changes';
	import { MorphologyEngine, type Morpheme as MorphType } from '$lib/engines/morphology';
	
	const languageId = $derived($page.params.id);
	
	let loading = $state(true);
	let activeSection = $state<'word-generator' | 'sound-changes' | 'paradigm-generator' | 'minimal-pairs' | 'phonotactic-probability'>('word-generator');
	
	interface Phoneme {
		_id: string;
		symbol: string;
		type: 'consonant' | 'vowel';
		ipa: string;
	}
	
	interface Word {
		_id: string;
		lemma: string;
		ipa?: string;
		wordClass: string;
	}
	
	interface SoundChange {
		_id: string;
		name: string;
		fromPattern: string;
		toPattern: string;
		environment?: string;
		orderIndex?: number;
	}
	
	interface GrammarCategory {
		_id: string;
		name: string;
		values: { name: string; abbreviation?: string; label?: string }[];
		appliesTo?: string[];
	}
	
	interface Morpheme {
		_id: string;
		form: string;
		type: 'prefix' | 'suffix' | 'infix' | 'circumfix';
		gloss: string;
		grammaticalMeaning?: Record<string, string>;
		allomorphs?: { form: string; condition: string }[];
	}
	
	interface InflectionClass {
		_id: string;
		name: string;
		wordClass: string;
		appliesTo?: string[];
		paradigm?: { features: Record<string, string>; form: string }[];
	}
	
	let phonemes = $state<Phoneme[]>([]);
	let words = $state<Word[]>([]);
	let soundChanges = $state<SoundChange[]>([]);
	let grammarCategories = $state<GrammarCategory[]>([]);
	let morphemes = $state<Morpheme[]>([]);
	let inflectionClasses = $state<InflectionClass[]>([]);
	
	async function loadData() {
		loading = true;
		try {
			const [phonemesData, wordsData, soundChangesData, categoriesData, morphemesData, classesData] = await Promise.all([
				runQuery<Phoneme[]>('phonology:listPhonemes', { languageId }),
				runQuery<Word[]>('lexicon:listWords', { languageId }),
				runQuery<SoundChange[]>('phonology:listSoundChanges', { languageId }),
				runQuery<GrammarCategory[]>('morphology:listGrammarCategories', { languageId }),
				runQuery<Morpheme[]>('morphology:listMorphemes', { languageId }),
				runQuery<InflectionClass[]>('morphology:listInflectionClasses', { languageId })
			]);
			phonemes = phonemesData ?? [];
			words = wordsData ?? [];
			soundChanges = soundChangesData ?? [];
			grammarCategories = categoriesData ?? [];
			morphemes = morphemesData ?? [];
			inflectionClasses = classesData ?? [];
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		loadData();
	});
	
	const phonemeFrequencies = $derived.by(() => {
		const freqMap = new Map<string, number>();
		let total = 0;
		for (const word of words) {
			const ipa = word.ipa || word.lemma;
			for (const char of ipa) {
				freqMap.set(char, (freqMap.get(char) || 0) + 1);
				total++;
			}
		}
		return Array.from(freqMap.entries())
			.map(([char, count]) => ({ char, freq: total > 0 ? count / total : 0 }))
			.sort((a, b) => b.freq - a.freq);
	});
	
	let generatorSettings = $state({
		minSyllables: 1,
		maxSyllables: 3,
		count: 10,
		structures: 'CV, CVC, VC'
	});
	let generatedWords = $state<string[]>([]);
	let selectedGeneratedWords = $state<Set<string>>(new Set());
	
	let scBatchSettings = $state({
		selectedWords: [] as string[],
		selectedRules: [] as string[],
		preview: [] as { original: string; result: string }[]
	});
	let scApplying = $state(false);
	
	let paradigmSettings = $state({
		word: '',
		wordClass: '',
		inflectionClassId: ''
	});
	let generatedParadigm = $state<{ labels: string[]; form: string }[]>([]);
	
	function generateWords() {
		const engine = new PhonotacticsEngine(phonemes);
		const structures = generatorSettings.structures.split(',').map(s => s.trim()).filter(Boolean);
		
		if (structures.length === 0) {
			structures.push('CV', 'CVC');
		}
		
		const newWords: string[] = [];
		for (let i = 0; i < generatorSettings.count; i++) {
			const syllableCount = Math.floor(
				Math.random() * (generatorSettings.maxSyllables - generatorSettings.minSyllables + 1)
			) + generatorSettings.minSyllables;
			
			const word = engine.generateWord(syllableCount, structures);
			if (word && !newWords.includes(word)) {
				newWords.push(word);
			}
		}
		
		generatedWords = newWords;
		selectedGeneratedWords = new Set();
	}
	
	function toggleWordSelection(word: string) {
		const newSet = new Set(selectedGeneratedWords);
		if (newSet.has(word)) {
			newSet.delete(word);
		} else {
			newSet.add(word);
		}
		selectedGeneratedWords = newSet;
	}
	
	function selectAllGenerated() {
		selectedGeneratedWords = new Set(generatedWords);
	}
	
	function deselectAllGenerated() {
		selectedGeneratedWords = new Set();
	}
	
	async function addSelectedToLexicon() {
		const wordsToAdd = Array.from(selectedGeneratedWords);
		
		for (const word of wordsToAdd) {
			await runMutation('lexicon:createWord', {
				languageId,
				userId: getUserId(),
				lemma: word,
				ipa: word,
				wordClass: 'noun'
			});
		}
		
		await loadData();
		
		generatedWords = generatedWords.filter(w => !selectedGeneratedWords.has(w));
		selectedGeneratedWords = new Set();
	}
	
	function previewSoundChanges() {
		if (scBatchSettings.selectedWords.length === 0) return;
		
		const selectedRules = soundChanges
			.filter(r => scBatchSettings.selectedRules.includes(r._id))
			.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
			.map(r => ({
				name: r.name,
				fromPattern: r.fromPattern,
				toPattern: r.toPattern,
				environment: r.environment,
				orderIndex: r.orderIndex
			} as SCType));
		
		const engine = new SoundChangeEngine();
		
		const selectedWordObjects = words.filter(w => scBatchSettings.selectedWords.includes(w._id));
		
		scBatchSettings.preview = selectedWordObjects.map(word => {
			const original = word.ipa || word.lemma;
			const result = engine.applyChanges(original, selectedRules);
			return { original, result: result.result };
		});
	}
	
	async function applySoundChangesToLexicon() {
		if (scBatchSettings.preview.length === 0) return;
		
		scApplying = true;
		try {
			const selectedRules = soundChanges
				.filter(r => scBatchSettings.selectedRules.includes(r._id))
				.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
				.map(r => ({
					name: r.name,
					fromPattern: r.fromPattern,
					toPattern: r.toPattern,
					environment: r.environment,
					orderIndex: r.orderIndex
				} as SCType));
			
			const engine = new SoundChangeEngine();
			
			const selectedWordObjects = words.filter(w => scBatchSettings.selectedWords.includes(w._id));
			
			for (const word of selectedWordObjects) {
				const original = word.ipa || word.lemma;
				const result = engine.applyChanges(original, selectedRules);
				
				if (result.result !== original) {
					await runMutation('lexicon:updateWord', {
						id: word._id,
						languageId,
						userId: getUserId(),
						ipa: result.result,
						lemma: result.result
					});
				}
			}
			
			await loadData();
			scBatchSettings.preview = [];
			scBatchSettings.selectedWords = [];
		} finally {
			scApplying = false;
		}
	}
	
	function generateParadigm() {
		if (!paradigmSettings.word || !paradigmSettings.inflectionClassId) {
			generatedParadigm = [];
			return;
		}
		
		const inflectionClass = inflectionClasses.find(ic => ic._id === paradigmSettings.inflectionClassId);
		if (!inflectionClass || !inflectionClass.paradigm) {
			generatedParadigm = [];
			return;
		}
		
		const morphList: MorphType[] = morphemes.map(m => ({
			form: m.form,
			gloss: m.gloss,
			type: m.type as 'prefix' | 'suffix' | 'infix' | 'circumfix' | 'interfix' | 'suprafix' | 'transfix',
			grammaticalMeaning: m.grammaticalMeaning,
			allomorphs: m.allomorphs
		}));
		
		const engine = new MorphologyEngine(morphList);
		
		const results: { labels: string[]; form: string }[] = [];
		
		for (const cell of inflectionClass.paradigm) {
			const labels: string[] = [];
			
			for (const [categoryName, valueName] of Object.entries(cell.features)) {
				const category = grammarCategories.find(c => c.name === categoryName || c._id === categoryName);
				const value = category?.values.find(v => v.name === valueName);
				if (value) {
					labels.push(value.abbreviation || value.name);
				} else {
					labels.push(valueName);
				}
			}
			
			let form = cell.form;
			if (form.includes('{stem}')) {
				form = form.replace(/\{stem\}/g, paradigmSettings.word);
			} else {
				form = paradigmSettings.word + form;
			}
			
			results.push({ labels, form });
		}
		
		generatedParadigm = results;
	}
	
	$effect(() => {
		if (paradigmSettings.word && paradigmSettings.inflectionClassId) {
			generateParadigm();
		}
	});
	
	let minimalPairsSettings = $state({
		phoneme1: '',
		phoneme2: '',
		autoDetect: true
	});
	let foundMinimalPairs = $state<{ word1: Word; word2: Word; difference: string }[]>([]);
	let allMinimalPairGroups = $state<{ phonemes: [string, string]; pairs: { word1: Word; word2: Word }[] }[]>([]);
	
	function findMinimalPairs() {
		if (minimalPairsSettings.autoDetect) {
			findAllMinimalPairs();
		} else {
			findMinimalPairsForPhonemes();
		}
	}
	
	function findAllMinimalPairs() {
		const phonemeSymbols = phonemes.map(p => p.ipa);
		const groups: typeof allMinimalPairGroups = [];
		
		for (let i = 0; i < phonemeSymbols.length; i++) {
			for (let j = i + 1; j < phonemeSymbols.length; j++) {
				const p1 = phonemeSymbols[i];
				const p2 = phonemeSymbols[j];
				const pairs = findPairsForPhonemes(p1, p2);
				
				if (pairs.length > 0) {
					groups.push({
						phonemes: [p1, p2],
						pairs
					});
				}
			}
		}
		
		groups.sort((a, b) => b.pairs.length - a.pairs.length);
		allMinimalPairGroups = groups;
		foundMinimalPairs = [];
	}
	
	function findMinimalPairsForPhonemes() {
		if (!minimalPairsSettings.phoneme1 || !minimalPairsSettings.phoneme2) {
			foundMinimalPairs = [];
			return;
		}
		
		const pairs = findPairsForPhonemes(
			minimalPairsSettings.phoneme1, 
			minimalPairsSettings.phoneme2
		);
		
		foundMinimalPairs = pairs.map(p => ({
			...p,
			difference: `${minimalPairsSettings.phoneme1} ~ ${minimalPairsSettings.phoneme2}`
		}));
		allMinimalPairGroups = [];
	}
	
	function findPairsForPhonemes(p1: string, p2: string): { word1: Word; word2: Word }[] {
		const pairs: { word1: Word; word2: Word }[] = [];
		
		for (let i = 0; i < words.length; i++) {
			const word1 = words[i];
			const ipa1 = word1.ipa || word1.lemma;
			
			for (let j = i + 1; j < words.length; j++) {
				const word2 = words[j];
				const ipa2 = word2.ipa || word2.lemma;
				
				if (isMinimalPair(ipa1, ipa2, p1, p2)) {
					pairs.push({ word1, word2 });
				}
			}
		}
		
		return pairs;
	}
	
	function isMinimalPair(ipa1: string, ipa2: string, p1: string, p2: string): boolean {
		if (ipa1.length !== ipa2.length) {
			const replaced1to2 = ipa1.replace(new RegExp(escapeRegex(p1), 'g'), p2);
			const replaced2to1 = ipa2.replace(new RegExp(escapeRegex(p1), 'g'), p2);
			
			if (replaced1to2 === ipa2 || replaced2to1 === ipa1) {
				const diff1 = countDifferences(ipa1, ipa2);
				return diff1 === 1;
			}
		}
		
		let differences = 0;
		let diffPositions: number[] = [];
		
		for (let i = 0; i < ipa1.length; i++) {
			if (ipa1[i] !== ipa2[i]) {
				differences++;
				diffPositions.push(i);
			}
		}
		
		if (differences !== 1) return false;
		
		const pos = diffPositions[0];
		const char1 = ipa1[pos];
		const char2 = ipa2[pos];
		
		return (char1 === p1 && char2 === p2) || (char1 === p2 && char2 === p1);
	}
	
	function countDifferences(s1: string, s2: string): number {
		const maxLen = Math.max(s1.length, s2.length);
		let diff = 0;
		for (let i = 0; i < maxLen; i++) {
			if (s1[i] !== s2[i]) diff++;
		}
		return diff;
	}
	
	function escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	
	let probabilitySettings = $state({
		word: '',
		syllableStructures: [] as string[]
	});
	let probabilityResult = $state<{ score: number; breakdown: { segment: string; frequency: number }[]; valid: boolean } | null>(null);
	
	function calculateProbability() {
		if (!probabilitySettings.word) {
			probabilityResult = null;
			return;
		}
		
		const phonemeFreqs = new Map<string, number>();
		let totalSegments = 0;
		
		for (const word of words) {
			const ipa = word.ipa || word.lemma;
			for (const char of ipa) {
				phonemeFreqs.set(char, (phonemeFreqs.get(char) || 0) + 1);
				totalSegments++;
			}
		}
		
		const breakdown: { segment: string; frequency: number }[] = [];
		let logProbability = 0;
		let allValid = true;
		
		const inputWord = probabilitySettings.word;
		for (const char of inputWord) {
			const count = phonemeFreqs.get(char) || 0;
			const freq = totalSegments > 0 ? count / totalSegments : 0;
			
			breakdown.push({ segment: char, frequency: freq });
			
			if (freq > 0) {
				logProbability += Math.log(freq);
			} else {
				const phonemeExists = phonemes.some(p => p.ipa === char || p.symbol === char);
				if (!phonemeExists) {
					allValid = false;
				}
				logProbability += Math.log(0.001);
			}
		}
		
		const normalizedScore = inputWord.length > 0 
			? Math.exp(logProbability / inputWord.length) * 100 
			: 0;
		
		probabilityResult = {
			score: Math.round(normalizedScore * 10) / 10,
			breakdown,
			valid: allValid
		};
	}
	
	$effect(() => {
		if (probabilitySettings.word) {
			calculateProbability();
		}
	});
	
	const sections = [
		{ id: 'word-generator', label: 'Word Generator' },
		{ id: 'sound-changes', label: 'Sound Changes' },
		{ id: 'paradigm-generator', label: 'Paradigm' },
		{ id: 'minimal-pairs', label: 'Minimal Pairs' },
		{ id: 'phonotactic-probability', label: 'Probability' }
	];
</script>

{#if loading}
	<div class="loading-container">
		<p>Loading tools data...</p>
	</div>
{:else}
<div class="tools-page">
	<Tabs 
		tabs={sections} 
		activeTab={activeSection} 
		ontabchange={(id) => activeSection = id as typeof activeSection}
	>
		{#if activeSection === 'word-generator'}
			<div class="section">
				<div class="section-header">
					<h2>Word Generator</h2>
				</div>
				
				<Card title="Generator Settings">
					<div class="generator-form">
						<div class="form-row">
							<div class="form-group">
								<label for="min-syllables">Min Syllables <HelpTooltip key="generatorMinSyllables" inline /></label>
								<Input 
									id="min-syllables" 
									type="number" 
									bind:value={generatorSettings.minSyllables}
								/>
							</div>
							<div class="form-group">
								<label for="max-syllables">Max Syllables <HelpTooltip key="generatorMaxSyllables" inline /></label>
								<Input 
									id="max-syllables" 
									type="number" 
									bind:value={generatorSettings.maxSyllables}
								/>
							</div>
							<div class="form-group">
								<label for="word-count">Words to Generate <HelpTooltip key="generatorCount" inline /></label>
								<Input 
									id="word-count" 
									type="number" 
									bind:value={generatorSettings.count}
								/>
							</div>
						</div>
						
						<div class="form-group">
							<label for="structures">Syllable Structures <HelpTooltip key="generatorStructures" inline /></label>
							<Input 
								id="structures" 
								bind:value={generatorSettings.structures}
								placeholder="CV, CVC, VC, CCV..."
							/>
							<span class="form-hint">Comma-separated. C = consonant, V = vowel</span>
						</div>
						
						<Button variant="primary" onclick={generateWords}>Generate Words</Button>
					</div>
				</Card>
				
				{#if phonemes.length === 0}
					<Card>
						<p class="empty-message">
							Add phonemes to your language first to generate words.
							Go to the Phonology section to add consonants and vowels.
						</p>
					</Card>
				{:else if generatedWords.length > 0}
					<Card title="Generated Words">
						<div class="generated-header">
							<span class="selection-info">
								{selectedGeneratedWords.size} of {generatedWords.length} selected
							</span>
							<div class="selection-actions">
								<Button size="sm" variant="ghost" onclick={selectAllGenerated}>Select All</Button>
								<Button size="sm" variant="ghost" onclick={deselectAllGenerated}>Deselect All</Button>
								<Button 
									size="sm" 
									variant="primary" 
									onclick={addSelectedToLexicon}
									disabled={selectedGeneratedWords.size === 0}
								>
									Add to Lexicon
								</Button>
							</div>
						</div>
						
						<div class="word-grid">
							{#each generatedWords as word}
								<button
									type="button"
									class="generated-word"
									class:selected={selectedGeneratedWords.has(word)}
									onclick={() => toggleWordSelection(word)}
								>
									{word}
								</button>
							{/each}
						</div>
					</Card>
				{/if}
				
				<Card title="Phoneme Inventory">
					<div class="inventory-summary">
						<div class="inventory-group">
							<span class="inventory-label">Consonants ({phonemes.filter(p => p.type === 'consonant').length}):</span>
							<span class="inventory-items">
								{phonemes.filter(p => p.type === 'consonant').map(p => p.symbol).join(' ')}
							</span>
						</div>
						<div class="inventory-group">
							<span class="inventory-label">Vowels ({phonemes.filter(p => p.type === 'vowel').length}):</span>
							<span class="inventory-items">
								{phonemes.filter(p => p.type === 'vowel').map(p => p.symbol).join(' ')}
							</span>
						</div>
					</div>
				</Card>
			</div>
		{:else if activeSection === 'sound-changes'}
			<div class="section">
				<div class="section-header">
					<h2>Sound Change Batch Applier</h2>
				</div>
				
				<Card>
					<p class="section-desc">
						Apply sound changes to multiple words in your lexicon at once.
						Select the words and rules, preview the changes, then apply.
					</p>
				</Card>
				
				{#if soundChanges.length === 0}
					<Card>
						<p class="empty-message">
							No sound change rules defined yet. Go to the Phonology section to add sound change rules.
						</p>
					</Card>
				{:else if words.length === 0}
					<Card>
						<p class="empty-message">
							No words in your lexicon yet. Add words first or use the Word Generator.
						</p>
					</Card>
				{:else}
					<div class="batch-layout">
						<Card title="Select Words">
							<div class="select-list">
								{#each words as word}
									<div class="select-item">
										<Checkbox 
											checked={scBatchSettings.selectedWords.includes(word._id)}
											onchange={() => {
												if (scBatchSettings.selectedWords.includes(word._id)) {
													scBatchSettings.selectedWords = scBatchSettings.selectedWords.filter(id => id !== word._id);
												} else {
													scBatchSettings.selectedWords = [...scBatchSettings.selectedWords, word._id];
												}
											}}
										/>
										<span class="item-label">{word.lemma}</span>
										{#if word.ipa && word.ipa !== word.lemma}
											<span class="item-ipa">/{word.ipa}/</span>
										{/if}
									</div>
								{/each}
							</div>
							<div class="select-actions">
								<Button 
									size="sm" 
									variant="ghost" 
									onclick={() => scBatchSettings.selectedWords = words.map(w => w._id)}
								>
									Select All
								</Button>
								<Button 
									size="sm" 
									variant="ghost" 
									onclick={() => scBatchSettings.selectedWords = []}
								>
									Deselect All
								</Button>
							</div>
						</Card>
						
						<Card title="Select Rules">
							<div class="select-list">
								{#each soundChanges.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) as rule}
									<div class="select-item">
										<Checkbox 
											checked={scBatchSettings.selectedRules.includes(rule._id)}
											onchange={() => {
												if (scBatchSettings.selectedRules.includes(rule._id)) {
													scBatchSettings.selectedRules = scBatchSettings.selectedRules.filter(id => id !== rule._id);
												} else {
													scBatchSettings.selectedRules = [...scBatchSettings.selectedRules, rule._id];
												}
											}}
										/>
									<span class="item-label">{rule.name}</span>
									<span class="item-pattern">{rule.fromPattern} → {rule.toPattern}</span>
									</div>
								{/each}
							</div>
							<div class="select-actions">
								<Button 
									size="sm" 
									variant="ghost" 
									onclick={() => scBatchSettings.selectedRules = soundChanges.map(r => r._id)}
								>
									Select All
								</Button>
								<Button 
									size="sm" 
									variant="ghost" 
									onclick={() => scBatchSettings.selectedRules = []}
								>
									Deselect All
								</Button>
							</div>
						</Card>
					</div>
					
					<Card title="Preview & Apply">
						<div class="preview-actions">
							<Button 
								variant="secondary" 
								onclick={previewSoundChanges}
								disabled={scBatchSettings.selectedWords.length === 0 || scBatchSettings.selectedRules.length === 0}
							>
								Preview Changes
							</Button>
							<Button 
								variant="primary" 
								onclick={applySoundChangesToLexicon}
								disabled={scBatchSettings.preview.length === 0}
								loading={scApplying}
							>
								Apply to Lexicon
							</Button>
						</div>
						
						{#if scBatchSettings.preview.length > 0}
							<div class="preview-list">
								{#each scBatchSettings.preview as change}
									<div class="preview-item" class:changed={change.original !== change.result}>
										<span class="preview-original">{change.original}</span>
										<span class="preview-arrow">→</span>
										<span class="preview-result">{change.result}</span>
										{#if change.original === change.result}
											<Badge label="unchanged" />
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</Card>
				{/if}
			</div>
		{:else if activeSection === 'paradigm-generator'}
			<div class="section">
				<div class="section-header">
					<h2>Paradigm Generator</h2>
				</div>
				
				<Card>
					<p class="section-desc">
						Generate full paradigms for words based on your inflection classes.
						Enter a word stem and select an inflection class to see all its forms.
					</p>
				</Card>
				
				{#if inflectionClasses.length === 0}
					<Card>
						<p class="empty-message">
							No inflection classes defined yet. Go to the Morphology section to create inflection classes.
						</p>
					</Card>
				{:else}
					<Card title="Paradigm Settings">
						<div class="paradigm-form">
							<div class="form-row">
								<div class="form-group">
									<label for="paradigm-word">Word/Stem <HelpTooltip key="paradigmWord" inline /></label>
									<Input 
										id="paradigm-word" 
										bind:value={paradigmSettings.word}
										placeholder="Enter a word stem..."
									/>
								</div>
								<div class="form-group">
									<label for="paradigm-class">Inflection Class <HelpTooltip key="paradigmClass" inline /></label>
									<Select 
										id="paradigm-class"
										options={[
											{ value: '', label: 'Select a class...' },
											...inflectionClasses.map(ic => ({ value: ic._id, label: ic.name }))
										]}
										bind:value={paradigmSettings.inflectionClassId}
									/>
								</div>
							</div>
							
							<Button variant="primary" onclick={generateParadigm}>Generate Paradigm</Button>
						</div>
					</Card>
					
					{#if generatedParadigm.length > 0}
						<Card title="Generated Paradigm">
							<div class="paradigm-table">
								<table>
									<thead>
										<tr>
											<th>Form</th>
											<th>Categories</th>
										</tr>
									</thead>
									<tbody>
										{#each generatedParadigm as row}
											<tr>
												<td class="paradigm-form">{row.form}</td>
												<td class="paradigm-labels">
													{#each row.labels as label}
														<Badge label={label} />
													{/each}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</Card>
					{:else if paradigmSettings.word && paradigmSettings.inflectionClassId}
						<Card>
							<p class="empty-message">
								No affixes defined for this inflection class, or no matching morphemes found.
							</p>
						</Card>
					{/if}
				{/if}
			</div>
		{:else if activeSection === 'minimal-pairs'}
			<div class="section">
				<div class="section-header">
					<h2>Minimal Pairs Finder</h2>
				</div>
				
				<Card>
					<p class="section-desc">
						Find minimal pairs in your lexicon - words that differ by only one phoneme.
						This helps verify phoneme contrasts and create teaching materials.
					</p>
				</Card>
				
				{#if words.length < 2}
					<Card>
						<p class="empty-message">
							You need at least 2 words in your lexicon to find minimal pairs.
						</p>
					</Card>
				{:else}
					<Card title="Search Options">
						<div class="minimal-pairs-form">
							<div class="toggle-row">
								<Checkbox 
									checked={minimalPairsSettings.autoDetect}
									onchange={() => minimalPairsSettings.autoDetect = !minimalPairsSettings.autoDetect}
									label="Auto-detect all minimal pairs"
								/>
							</div>
							
							{#if !minimalPairsSettings.autoDetect}
								<div class="form-row">
									<div class="form-group">
										<label for="phoneme1">Phoneme 1</label>
										<Select
											id="phoneme1"
											options={[
												{ value: '', label: 'Select...' },
												...phonemes.map(p => ({ value: p.ipa, label: `/${p.ipa}/` }))
											]}
											bind:value={minimalPairsSettings.phoneme1}
										/>
									</div>
									<div class="form-group">
										<label for="phoneme2">Phoneme 2</label>
										<Select
											id="phoneme2"
											options={[
												{ value: '', label: 'Select...' },
												...phonemes.map(p => ({ value: p.ipa, label: `/${p.ipa}/` }))
											]}
											bind:value={minimalPairsSettings.phoneme2}
										/>
									</div>
								</div>
							{/if}
							
							<Button variant="primary" onclick={findMinimalPairs}>
								{minimalPairsSettings.autoDetect ? 'Find All Minimal Pairs' : 'Find Pairs'}
							</Button>
						</div>
					</Card>
					
					{#if minimalPairsSettings.autoDetect && allMinimalPairGroups.length > 0}
						<Card title="Minimal Pairs by Phoneme Contrast">
							<div class="pairs-groups">
								{#each allMinimalPairGroups as group}
									<div class="pairs-group">
										<div class="group-header">
											<Badge label={`/${group.phonemes[0]}/ ~ /${group.phonemes[1]}/`} />
											<span class="pair-count">{group.pairs.length} pair{group.pairs.length === 1 ? '' : 's'}</span>
										</div>
										<div class="pairs-list">
											{#each group.pairs as pair}
												<div class="pair-item">
													<span class="pair-word">{pair.word1.lemma}</span>
													<span class="pair-ipa">/{pair.word1.ipa || pair.word1.lemma}/</span>
													<span class="pair-separator">~</span>
													<span class="pair-word">{pair.word2.lemma}</span>
													<span class="pair-ipa">/{pair.word2.ipa || pair.word2.lemma}/</span>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</Card>
					{:else if !minimalPairsSettings.autoDetect && foundMinimalPairs.length > 0}
						<Card title="Found Minimal Pairs">
							<div class="pairs-list">
								{#each foundMinimalPairs as pair}
									<div class="pair-item">
										<span class="pair-word">{pair.word1.lemma}</span>
										<span class="pair-ipa">/{pair.word1.ipa || pair.word1.lemma}/</span>
										<span class="pair-separator">~</span>
										<span class="pair-word">{pair.word2.lemma}</span>
										<span class="pair-ipa">/{pair.word2.ipa || pair.word2.lemma}/</span>
									</div>
								{/each}
							</div>
						</Card>
					{:else if (minimalPairsSettings.autoDetect && allMinimalPairGroups.length === 0) || (!minimalPairsSettings.autoDetect && foundMinimalPairs.length === 0 && minimalPairsSettings.phoneme1 && minimalPairsSettings.phoneme2)}
						<Card>
							<p class="empty-message">No minimal pairs found. Try adding more words to your lexicon.</p>
						</Card>
					{/if}
				{/if}
			</div>
		{:else if activeSection === 'phonotactic-probability'}
			<div class="section">
				<div class="section-header">
					<h2>Phonotactic Probability</h2>
				</div>
				
				<Card>
					<p class="section-desc">
						Calculate how "natural" a word sounds based on phoneme frequencies in your lexicon.
						Higher scores indicate the word uses common phoneme patterns.
					</p>
				</Card>
				
				{#if words.length === 0}
					<Card>
						<p class="empty-message">
							Add words to your lexicon first to calculate phonotactic probabilities.
						</p>
					</Card>
				{:else}
					<Card title="Calculate Probability">
						<div class="probability-form">
							<div class="form-group">
								<label for="prob-word">Word to Analyze <HelpTooltip key="probWord" inline /></label>
								<Input 
									id="prob-word"
									bind:value={probabilitySettings.word}
									placeholder="Enter a word or IPA..."
								/>
							</div>
							
							<Button variant="primary" onclick={calculateProbability}>Calculate</Button>
						</div>
					</Card>
					
					{#if probabilityResult}
						<Card title="Probability Analysis">
							<div class="probability-result">
								<div class="score-display">
									<span class="score-label">Naturalness Score</span>
									<span class="score-value" class:high={probabilityResult.score > 50} class:medium={probabilityResult.score > 20 && probabilityResult.score <= 50} class:low={probabilityResult.score <= 20}>
										{probabilityResult.score}%
									</span>
									{#if !probabilityResult.valid}
										<Badge label="Contains unknown phonemes" />
									{/if}
								</div>
								
								<div class="breakdown-section">
									<h4>Segment Breakdown</h4>
									<div class="breakdown-list">
										{#each probabilityResult.breakdown as segment}
											<div class="breakdown-item">
												<span class="segment-char">{segment.segment}</span>
												<div class="segment-bar">
													<div class="segment-fill" style="width: {Math.min(segment.frequency * 100, 100)}%"></div>
												</div>
												<span class="segment-freq">{(segment.frequency * 100).toFixed(1)}%</span>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</Card>
					{/if}
					
					<Card title="Phoneme Frequencies">
						<div class="frequency-chart">
							{#each phonemeFrequencies.slice(0, 20) as item}
								<div class="freq-item">
									<span class="freq-char">{item.char}</span>
									<div class="freq-bar">
										<div class="freq-fill" style="width: {item.freq * 100 * 5}%"></div>
									</div>
									<span class="freq-pct">{(item.freq * 100).toFixed(1)}%</span>
								</div>
							{/each}
						</div>
					</Card>
				{/if}
			</div>
		{/if}
	</Tabs>
</div>
{/if}

<style>
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--space-12);
		color: var(--color-text-secondary);
	}
	
	.tools-page {
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
	
	.generator-form,
	.paradigm-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
	
	.generated-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	
	.selection-info {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.selection-actions {
		display: flex;
		gap: var(--space-2);
	}
	
	.word-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--space-2);
	}
	
	.generated-word {
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		font-family: monospace;
		font-size: var(--size-md);
		color: var(--color-text);
		text-align: center;
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.generated-word:hover {
		background: var(--color-bg-hover);
	}
	
	.generated-word.selected {
		border-color: var(--color-primary);
		background: var(--color-primary-alpha);
	}
	
	.inventory-summary {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.inventory-group {
		display: flex;
		gap: var(--space-2);
	}
	
	.inventory-label {
		font-weight: 500;
		min-width: 140px;
	}
	
	.inventory-items {
		font-family: monospace;
		color: var(--color-text-secondary);
	}
	
	.batch-layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-4);
	}
	
	.select-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-height: 300px;
		overflow-y: auto;
	}
	
	.select-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	
	.select-item:hover {
		background: var(--color-bg-hover);
	}
	
	.item-label {
		font-weight: 500;
	}
	
	.item-ipa,
	.item-pattern {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		font-family: monospace;
	}
	
	.select-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}
	
	.preview-actions {
		display: flex;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}
	
	.preview-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.preview-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		font-family: monospace;
	}
	
	.preview-item.changed {
		background: var(--color-success-alpha);
	}
	
	.preview-original {
		color: var(--color-text-secondary);
	}
	
	.preview-arrow {
		color: var(--color-text-tertiary);
	}
	
	.preview-result {
		font-weight: 500;
	}
	
	.paradigm-table {
		overflow-x: auto;
	}
	
	.paradigm-table table {
		width: 100%;
		border-collapse: collapse;
	}
	
	.paradigm-table th,
	.paradigm-table td {
		padding: var(--space-3);
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}
	
	.paradigm-table th {
		font-weight: 600;
		background: var(--color-bg-tertiary);
	}
	
	.paradigm-form {
		font-family: monospace;
		font-weight: 500;
	}
	
	.paradigm-labels {
		display: flex;
		gap: var(--space-1);
		flex-wrap: wrap;
	}
	
	.empty-message {
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--space-8);
	}
	
	.minimal-pairs-form,
	.probability-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.toggle-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
	}
	
	.pairs-groups {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.pairs-group {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	
	.group-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-bottom: 1px solid var(--color-border);
	}
	
	.pair-count {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.pairs-list {
		display: flex;
		flex-direction: column;
	}
	
	.pair-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}
	
	.pair-item:last-child {
		border-bottom: none;
	}
	
	.pair-word {
		font-weight: 500;
	}
	
	.pair-ipa {
		font-family: monospace;
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
	}
	
	.pair-separator {
		color: var(--color-text-tertiary);
		margin: 0 var(--space-2);
	}
	
	.probability-result {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	
	.score-display {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	
	.score-label {
		font-weight: 500;
	}
	
	.score-value {
		font-size: var(--size-2xl);
		font-weight: 700;
	}
	
	.score-value.high {
		color: var(--color-success);
	}
	
	.score-value.medium {
		color: var(--color-warning);
	}
	
	.score-value.low {
		color: var(--color-error);
	}
	
	.breakdown-section h4 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--size-sm);
		font-weight: 600;
	}
	
	.breakdown-list,
	.frequency-chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.breakdown-item,
	.freq-item {
		display: grid;
		grid-template-columns: 40px 1fr 60px;
		align-items: center;
		gap: var(--space-3);
	}
	
	.segment-char,
	.freq-char {
		font-family: monospace;
		font-weight: 500;
		text-align: center;
	}
	
	.segment-bar,
	.freq-bar {
		height: 8px;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	
	.segment-fill,
	.freq-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: var(--radius-sm);
	}
	
	.segment-freq,
	.freq-pct {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		text-align: right;
	}
</style>
