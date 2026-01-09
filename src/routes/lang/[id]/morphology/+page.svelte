<script lang="ts">
	import { page } from '$app/stores';
	import { Card, Button, Input, Modal, Tabs, Select, Badge, Textarea, HelpTooltip, Checkbox } from '$lib/components/ui';
	import { runQuery, runMutation, getUserId } from '$lib/convex';
	import { onMount } from 'svelte';
	
	const languageId = $derived($page.params.id);
	
	let activeSection = $state<'categories' | 'morphemes' | 'inflection-classes'>('categories');
	
	let categoryModalOpen = $state(false);
	let editingCategory = $state<GrammarCategory | null>(null);
	let categoryForm = $state({
		name: '',
		abbreviation: '',
		description: '',
		appliesTo: [] as string[],
		values: ''
	});
	
	let morphemeModalOpen = $state(false);
	let editingMorpheme = $state<Morpheme | null>(null);
	let morphemeForm = $state({
		form: '',
		gloss: '',
		type: 'suffix' as AffixType,
		description: '',
		phonologicalCondition: '',
		allomorphs: '',
		grammaticalMeaning: ''
	});
	
	let inflectionClassModalOpen = $state(false);
	let editingInflectionClass = $state<InflectionClass | null>(null);
	let inflectionClassForm = $state({
		name: '',
		wordClass: 'noun' as WordClass,
		description: '',
		paradigm: ''
	});
	
	let saving = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	
	type AffixType = 'prefix' | 'suffix' | 'infix' | 'circumfix' | 'interfix' | 'suprafix' | 'transfix';
	type WordClass = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'determiner' | 'preposition' | 'postposition' | 'conjunction' | 'interjection' | 'particle' | 'numeral' | 'classifier' | 'auxiliary' | 'copula' | 'other';
	
	interface GrammarValue {
		name: string;
		abbreviation: string;
		description?: string;
	}
	
	interface GrammarCategory {
		_id: string;
		name: string;
		abbreviation?: string;
		description?: string;
		values?: GrammarValue[];
		appliesTo?: string[];
	}
	
	interface Allomorph {
		form: string;
		condition: string;
		description?: string;
	}
	
	interface Morpheme {
		_id: string;
		form: string;
		gloss: string;
		type: AffixType;
		description?: string;
		phonologicalCondition?: string;
		allomorphs?: Allomorph[];
		grammaticalMeaning?: Record<string, string>;
	}
	
	interface ParadigmCell {
		features: Record<string, string>;
		form: string;
		isRegular: boolean;
	}
	
	interface InflectionClass {
		_id: string;
		name: string;
		wordClass: WordClass;
		description?: string;
		paradigm?: ParadigmCell[];
	}
	
	let grammarCategories = $state<GrammarCategory[]>([]);
	let morphemes = $state<Morpheme[]>([]);
	let inflectionClasses = $state<InflectionClass[]>([]);
	let loading = $state(true);
	
	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [categoriesData, morphemesData, classesData] = await Promise.all([
				runQuery<GrammarCategory[]>('morphology:getGrammarCategories', { languageId }),
				runQuery<Morpheme[]>('morphology:getMorphemes', { languageId }),
				runQuery<InflectionClass[]>('morphology:getInflectionClasses', { languageId })
			]);
			
			grammarCategories = categoriesData ?? [];
			morphemes = morphemesData ?? [];
			inflectionClasses = classesData ?? [];
		} catch (e) {
			console.error('Failed to load morphology data:', e);
		} finally {
			loading = false;
		}
	}
	
	const affixTypes: { value: AffixType; label: string }[] = [
		{ value: 'prefix', label: 'Prefix' },
		{ value: 'suffix', label: 'Suffix' },
		{ value: 'infix', label: 'Infix' },
		{ value: 'circumfix', label: 'Circumfix' },
		{ value: 'interfix', label: 'Interfix' },
		{ value: 'suprafix', label: 'Suprafix' },
		{ value: 'transfix', label: 'Transfix' }
	];
	
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
	
	function openCategoryModal(category?: GrammarCategory) {
		if (category) {
			editingCategory = category;
			categoryForm = {
				name: category.name,
				abbreviation: category.abbreviation ?? '',
				description: category.description ?? '',
				appliesTo: category.appliesTo ?? [],
				values: category.values?.map(v => `${v.name}:${v.abbreviation}`).join('\n') ?? ''
			};
		} else {
			editingCategory = null;
			categoryForm = {
				name: '',
				abbreviation: '',
				description: '',
				appliesTo: [],
				values: ''
			};
		}
		categoryModalOpen = true;
	}
	
	function parseGrammarValues(text: string): GrammarValue[] {
		return text.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.map(line => {
				const [name, abbreviation] = line.split(':').map(s => s.trim());
				return { name: name || '', abbreviation: abbreviation || name?.substring(0, 3).toUpperCase() || '' };
			});
	}
	
	async function saveCategory() {
		saving = true;
		try {
			const payload = {
				userId: getUserId(),
				languageId,
				name: categoryForm.name,
				abbreviation: categoryForm.abbreviation || undefined,
				description: categoryForm.description || undefined,
				appliesTo: categoryForm.appliesTo.length > 0 ? categoryForm.appliesTo : undefined,
				values: categoryForm.values ? parseGrammarValues(categoryForm.values) : undefined
			};
			
			if (editingCategory) {
				await runMutation('morphology:updateGrammarCategory', {
					...payload,
					id: editingCategory._id
				});
			} else {
				await runMutation('morphology:createGrammarCategory', payload);
			}
			
			await loadData();
			categoryModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteCategory(id: string) {
		await runMutation('morphology:deleteGrammarCategory', {
			userId: getUserId(),
			id
		});
		await loadData();
		deleteConfirmId = null;
	}
	
	function openMorphemeModal(morpheme?: Morpheme) {
		if (morpheme) {
			editingMorpheme = morpheme;
			morphemeForm = {
				form: morpheme.form,
				gloss: morpheme.gloss,
				type: morpheme.type,
				description: morpheme.description ?? '',
				phonologicalCondition: morpheme.phonologicalCondition ?? '',
				allomorphs: morpheme.allomorphs?.map(a => `${a.form}:${a.condition}`).join('\n') ?? '',
				grammaticalMeaning: morpheme.grammaticalMeaning ? 
					Object.entries(morpheme.grammaticalMeaning).map(([k, v]) => `${k}:${v}`).join('\n') : ''
			};
		} else {
			editingMorpheme = null;
			morphemeForm = {
				form: '',
				gloss: '',
				type: 'suffix',
				description: '',
				phonologicalCondition: '',
				allomorphs: '',
				grammaticalMeaning: ''
			};
		}
		morphemeModalOpen = true;
	}
	
	function parseAllomorphs(text: string): Allomorph[] {
		return text.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.map(line => {
				const [form, condition] = line.split(':').map(s => s.trim());
				return { form: form || '', condition: condition || '' };
			});
	}
	
	function parseGrammaticalMeaning(text: string): Record<string, string> {
		const result: Record<string, string> = {};
		text.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.forEach(line => {
				const [key, value] = line.split(':').map(s => s.trim());
				if (key && value) result[key] = value;
			});
		return result;
	}
	
	async function saveMorpheme() {
		saving = true;
		try {
			const payload = {
				userId: getUserId(),
				languageId,
				form: morphemeForm.form,
				gloss: morphemeForm.gloss,
				type: morphemeForm.type,
				description: morphemeForm.description || undefined,
				phonologicalCondition: morphemeForm.phonologicalCondition || undefined,
				allomorphs: morphemeForm.allomorphs ? parseAllomorphs(morphemeForm.allomorphs) : undefined,
				grammaticalMeaning: morphemeForm.grammaticalMeaning ? parseGrammaticalMeaning(morphemeForm.grammaticalMeaning) : undefined
			};
			
			if (editingMorpheme) {
				await runMutation('morphology:updateMorpheme', {
					...payload,
					id: editingMorpheme._id
				});
			} else {
				await runMutation('morphology:createMorpheme', payload);
			}
			
			await loadData();
			morphemeModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteMorpheme(id: string) {
		await runMutation('morphology:deleteMorpheme', {
			userId: getUserId(),
			id
		});
		await loadData();
		deleteConfirmId = null;
	}
	
	function openInflectionClassModal(inflectionClass?: InflectionClass) {
		if (inflectionClass) {
			editingInflectionClass = inflectionClass;
			inflectionClassForm = {
				name: inflectionClass.name,
				wordClass: inflectionClass.wordClass,
				description: inflectionClass.description ?? '',
				paradigm: inflectionClass.paradigm?.map(p => 
					`${Object.entries(p.features).map(([k, v]) => `${k}=${v}`).join(',')}:${p.form}`
				).join('\n') ?? ''
			};
		} else {
			editingInflectionClass = null;
			inflectionClassForm = {
				name: '',
				wordClass: 'noun',
				description: '',
				paradigm: ''
			};
		}
		inflectionClassModalOpen = true;
	}
	
	function parseParadigm(text: string): ParadigmCell[] {
		return text.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.map(line => {
				const [featuresStr, form] = line.split(':').map(s => s.trim());
				const features: Record<string, string> = {};
				featuresStr?.split(',').forEach(pair => {
					const [key, value] = pair.split('=').map(s => s.trim());
					if (key && value) features[key] = value;
				});
				return { features, form: form || '', isRegular: true };
			});
	}
	
	async function saveInflectionClass() {
		saving = true;
		try {
			const payload = {
				userId: getUserId(),
				languageId,
				name: inflectionClassForm.name,
				wordClass: inflectionClassForm.wordClass,
				description: inflectionClassForm.description || undefined,
				paradigm: inflectionClassForm.paradigm ? parseParadigm(inflectionClassForm.paradigm) : undefined
			};
			
			if (editingInflectionClass) {
				await runMutation('morphology:updateInflectionClass', {
					...payload,
					id: editingInflectionClass._id
				});
			} else {
				await runMutation('morphology:createInflectionClass', payload);
			}
			
			await loadData();
			inflectionClassModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteInflectionClass(id: string) {
		await runMutation('morphology:deleteInflectionClass', {
			userId: getUserId(),
			id
		});
		await loadData();
		deleteConfirmId = null;
	}
	
	function formatMorpheme(morpheme: Morpheme): string {
		switch (morpheme.type) {
			case 'prefix': return `${morpheme.form}-`;
			case 'suffix': return `-${morpheme.form}`;
			case 'infix': return `-${morpheme.form}-`;
			case 'circumfix': return `${morpheme.form.split('...')[0] || morpheme.form}-...-${morpheme.form.split('...')[1] || ''}`;
			default: return morpheme.form;
		}
	}
	
	function toggleAppliesTo(wordClass: string) {
		if (categoryForm.appliesTo.includes(wordClass)) {
			categoryForm.appliesTo = categoryForm.appliesTo.filter(w => w !== wordClass);
		} else {
			categoryForm.appliesTo = [...categoryForm.appliesTo, wordClass];
		}
	}
	
	const sections = [
		{ id: 'categories', label: 'Grammar Categories' },
		{ id: 'morphemes', label: 'Morphemes' },
		{ id: 'inflection-classes', label: 'Inflection Classes' }
	];
</script>

<div class="morphology-page">
	{#if loading}
		<div class="loading-state">
			<p>Loading morphology data...</p>
		</div>
	{:else}
		<Tabs 
			tabs={sections} 
			activeTab={activeSection} 
			ontabchange={(id) => activeSection = id as typeof activeSection}
		>
			{#if activeSection === 'categories'}
				<div class="section">
					<div class="section-header">
						<h2>Grammar Categories</h2>
						<Button variant="primary" onclick={() => openCategoryModal()}>Add Category</Button>
					</div>
					
					<Card>
						<p class="section-desc">
							Define grammatical categories like case, number, gender, tense, aspect, mood, etc.
							Each category can have multiple values (e.g., Number: singular, plural, dual).
						</p>
					</Card>
					
					<div class="category-grid">
						{#each grammarCategories as category}
							<Card>
								<div class="category-header">
									<h3 class="category-name">{category.name}</h3>
									{#if category.abbreviation}
										<Badge label={category.abbreviation} />
									{/if}
								</div>
								{#if category.description}
									<p class="category-desc">{category.description}</p>
								{/if}
								{#if category.appliesTo?.length}
									<div class="category-applies">
										Applies to: {category.appliesTo.join(', ')}
									</div>
								{/if}
								{#if category.values?.length}
									<div class="category-values">
										<span class="values-label">Values:</span>
										<div class="values-list">
											{#each category.values as value}
												<Badge label="{value.name} ({value.abbreviation})" />
											{/each}
										</div>
									</div>
								{/if}
								<div class="category-actions">
									<Button size="sm" variant="ghost" onclick={() => openCategoryModal(category)}>Edit</Button>
									<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `cat-${category._id}`}>Delete</Button>
								</div>
							</Card>
						{:else}
							<Card>
								<p class="empty-message">No grammar categories defined yet. Common categories include: Case, Number, Gender, Tense, Aspect, Mood, Person, Voice.</p>
							</Card>
						{/each}
					</div>
				</div>
			{:else if activeSection === 'morphemes'}
				<div class="section">
					<div class="section-header">
						<h2>Morphemes</h2>
						<Button variant="primary" onclick={() => openMorphemeModal()}>Add Morpheme</Button>
					</div>
					
					<Card>
						<p class="section-desc">
							Define affixes and other bound morphemes. Each morpheme can have allomorphs (variant forms)
							and be associated with grammatical meanings.
						</p>
					</Card>
					
					<div class="morpheme-list">
						{#each morphemes as morpheme}
							<div class="morpheme-item">
								<div class="morpheme-header">
									<span class="morpheme-form">{formatMorpheme(morpheme)}</span>
									<Badge label={morpheme.type} />
									<span class="morpheme-gloss">{morpheme.gloss}</span>
								</div>
								{#if morpheme.description}
									<p class="morpheme-desc">{morpheme.description}</p>
								{/if}
								{#if morpheme.phonologicalCondition}
									<div class="morpheme-condition">
										Condition: <code>{morpheme.phonologicalCondition}</code>
									</div>
								{/if}
								{#if morpheme.allomorphs?.length}
									<div class="morpheme-allomorphs">
										Allomorphs: {morpheme.allomorphs.map(a => `${a.form} (${a.condition})`).join(', ')}
									</div>
								{/if}
								{#if morpheme.grammaticalMeaning && Object.keys(morpheme.grammaticalMeaning).length > 0}
									<div class="morpheme-meaning">
										{#each Object.entries(morpheme.grammaticalMeaning) as [key, value]}
											<Badge label="{key}: {value}" />
										{/each}
									</div>
								{/if}
								<div class="morpheme-actions">
									<Button size="sm" variant="ghost" onclick={() => openMorphemeModal(morpheme)}>Edit</Button>
									<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `morph-${morpheme._id}`}>Delete</Button>
								</div>
							</div>
						{:else}
							<Card>
								<p class="empty-message">No morphemes defined yet. Add prefixes, suffixes, and other affixes here.</p>
							</Card>
						{/each}
					</div>
				</div>
			{:else if activeSection === 'inflection-classes'}
				<div class="section">
					<div class="section-header">
						<h2>Inflection Classes</h2>
						<Button variant="primary" onclick={() => openInflectionClassModal()}>Add Class</Button>
					</div>
					
					<Card>
						<p class="section-desc">
							Define inflection classes (declensions, conjugations) that group words with similar inflection patterns.
							Each class contains a paradigm showing all possible forms.
						</p>
					</Card>
					
					<div class="inflection-list">
						{#each inflectionClasses as inflClass}
							<Card title={inflClass.name}>
								{#snippet actions()}
									<Badge label={inflClass.wordClass} />
								{/snippet}
								
								{#if inflClass.description}
									<p class="inflection-desc">{inflClass.description}</p>
								{/if}
								
								{#if inflClass.paradigm?.length}
									<div class="paradigm-table">
										<table>
											<thead>
												<tr>
													<th>Features</th>
													<th>Form</th>
												</tr>
											</thead>
											<tbody>
												{#each inflClass.paradigm as cell}
													<tr>
														<td>
															{#each Object.entries(cell.features) as [key, value]}
																<Badge label="{key}={value}" />
															{/each}
														</td>
														<td class="form-cell">{cell.form}</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{:else}
									<p class="empty-paradigm">No paradigm defined yet.</p>
								{/if}
								
								<div class="inflection-actions">
									<Button size="sm" variant="ghost" onclick={() => openInflectionClassModal(inflClass)}>Edit</Button>
									<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `infl-${inflClass._id}`}>Delete</Button>
								</div>
							</Card>
						{:else}
							<Card>
								<p class="empty-message">No inflection classes defined yet. Create declension and conjugation patterns here.</p>
							</Card>
						{/each}
					</div>
				</div>
			{/if}
		</Tabs>
	{/if}
</div>

<Modal 
	bind:open={categoryModalOpen} 
	title={editingCategory ? 'Edit Grammar Category' : 'Add Grammar Category'}
	size="md"
	onclose={() => categoryModalOpen = false}
>
	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="cat-name">Category Name <HelpTooltip key="categoryName" inline /></label>
				<Input id="cat-name" bind:value={categoryForm.name} placeholder="e.g. Number, Case, Tense" />
			</div>
			<div class="form-group">
				<label for="cat-abbrev">Abbreviation <HelpTooltip key="categoryAbbreviation" inline /></label>
				<Input id="cat-abbrev" bind:value={categoryForm.abbreviation} placeholder="e.g. NUM, CASE" />
			</div>
		</div>
		
		<div class="form-group">
			<label for="cat-desc">Description</label>
			<Input id="cat-desc" bind:value={categoryForm.description} placeholder="Describe this category..." />
		</div>
		
		<div class="form-group">
			<label>Applies To <HelpTooltip key="categoryAppliesTo" inline /></label>
			<div class="checkbox-grid">
				{#each wordClasses.slice(0, 8) as wc}
					<Checkbox 
						checked={categoryForm.appliesTo.includes(wc.value)}
						onchange={() => toggleAppliesTo(wc.value)}
						label={wc.label}
					/>
				{/each}
			</div>
		</div>
		
		<div class="form-group">
			<label for="cat-values">Values <HelpTooltip key="categoryValues" inline /></label>
			<Textarea 
				id="cat-values" 
				bind:value={categoryForm.values} 
				placeholder="singular:SG&#10;plural:PL&#10;dual:DU"
				rows={5}
			/>
			<span class="form-hint">One per line, format: Name:ABBREVIATION</span>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => categoryModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveCategory} loading={saving} disabled={!categoryForm.name}>
			{editingCategory ? 'Update' : 'Add'} Category
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={morphemeModalOpen} 
	title={editingMorpheme ? 'Edit Morpheme' : 'Add Morpheme'}
	size="md"
	onclose={() => morphemeModalOpen = false}
>
	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="morph-form">Form <HelpTooltip key="morphemeForm" inline /></label>
				<Input id="morph-form" bind:value={morphemeForm.form} placeholder="e.g. -s, -ed, un-" />
			</div>
			<div class="form-group">
				<label for="morph-type">Type <HelpTooltip key="morphemeType" inline /></label>
				<Select id="morph-type" options={affixTypes} bind:value={morphemeForm.type} />
			</div>
		</div>
		
		<div class="form-group">
			<label for="morph-gloss">Gloss <HelpTooltip key="morphemeGloss" inline /></label>
			<Input id="morph-gloss" bind:value={morphemeForm.gloss} placeholder="e.g. PL, PAST, NEG" />
		</div>
		
		<div class="form-group">
			<label for="morph-desc">Description</label>
			<Input id="morph-desc" bind:value={morphemeForm.description} placeholder="Describe this morpheme..." />
		</div>
		
		<div class="form-group">
			<label for="morph-condition">Phonological Condition <HelpTooltip key="morphemeCondition" inline /></label>
			<Input id="morph-condition" bind:value={morphemeForm.phonologicalCondition} placeholder="e.g. after vowel, before consonant" />
		</div>
		
		<div class="form-group">
			<label for="morph-allomorphs">Allomorphs <HelpTooltip key="morphemeAllomorphs" inline /></label>
			<Textarea 
				id="morph-allomorphs" 
				bind:value={morphemeForm.allomorphs} 
				placeholder="-es:after sibilant&#10;-s:elsewhere"
				rows={3}
			/>
			<span class="form-hint">One per line, format: form:condition</span>
		</div>
		
		<div class="form-group">
			<label for="morph-meaning">Grammatical Meaning <HelpTooltip key="morphemeGrammaticalMeaning" inline /></label>
			<Textarea 
				id="morph-meaning" 
				bind:value={morphemeForm.grammaticalMeaning} 
				placeholder="number:plural&#10;case:nominative"
				rows={3}
			/>
			<span class="form-hint">One per line, format: category:value</span>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => morphemeModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveMorpheme} loading={saving} disabled={!morphemeForm.form || !morphemeForm.gloss}>
			{editingMorpheme ? 'Update' : 'Add'} Morpheme
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={inflectionClassModalOpen} 
	title={editingInflectionClass ? 'Edit Inflection Class' : 'Add Inflection Class'}
	size="lg"
	onclose={() => inflectionClassModalOpen = false}
>
	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="infl-name">Class Name <HelpTooltip key="inflectionClassName" inline /></label>
				<Input id="infl-name" bind:value={inflectionClassForm.name} placeholder="e.g. 1st Declension, Strong Verbs" />
			</div>
			<div class="form-group">
				<label for="infl-class">Word Class <HelpTooltip key="inflectionClassWordClass" inline /></label>
				<Select id="infl-class" options={wordClasses} bind:value={inflectionClassForm.wordClass} />
			</div>
		</div>
		
		<div class="form-group">
			<label for="infl-desc">Description</label>
			<Input id="infl-desc" bind:value={inflectionClassForm.description} placeholder="Describe this inflection class..." />
		</div>
		
		<div class="form-group">
			<label for="infl-paradigm">Paradigm <HelpTooltip key="inflectionClassParadigm" inline /></label>
			<Textarea 
				id="infl-paradigm" 
				bind:value={inflectionClassForm.paradigm} 
				placeholder="case=nom,number=sg:-us&#10;case=gen,number=sg:-i&#10;case=dat,number=sg:-o&#10;case=acc,number=sg:-um"
				rows={8}
			/>
			<span class="form-hint">
				One per line, format: feature1=value1,feature2=value2:form
			</span>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => inflectionClassModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveInflectionClass} loading={saving} disabled={!inflectionClassForm.name}>
			{editingInflectionClass ? 'Update' : 'Add'} Class
		</Button>
	{/snippet}
</Modal>

<Modal 
	open={deleteConfirmId !== null}
	title="Confirm Delete"
	size="sm"
	onclose={() => deleteConfirmId = null}
>
	<p>Are you sure you want to delete this item? This action cannot be undone.</p>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => deleteConfirmId = null}>Cancel</Button>
		<Button 
			variant="danger" 
			onclick={() => {
				if (deleteConfirmId?.startsWith('cat-')) {
					deleteCategory(deleteConfirmId.replace('cat-', ''));
				} else if (deleteConfirmId?.startsWith('morph-')) {
					deleteMorpheme(deleteConfirmId.replace('morph-', ''));
				} else if (deleteConfirmId?.startsWith('infl-')) {
					deleteInflectionClass(deleteConfirmId.replace('infl-', ''));
				}
			}}
		>
			Delete
		</Button>
	{/snippet}
</Modal>

<style>
	.morphology-page {
		max-width: 1200px;
	}
	
	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--space-12);
		color: var(--color-text-secondary);
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
	
	.category-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-4);
	}
	
	.category-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}
	
	.category-name {
		font-size: var(--size-md);
		font-weight: 600;
		margin: 0;
	}
	
	.category-desc {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: var(--space-2) 0;
	}
	
	.category-applies {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
		margin: var(--space-2) 0;
	}
	
	.category-values {
		margin: var(--space-3) 0;
	}
	
	.values-label {
		font-size: var(--size-sm);
		font-weight: 500;
		display: block;
		margin-bottom: var(--space-2);
	}
	
	.values-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	
	.category-actions {
		display: flex;
		gap: var(--space-1);
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}
	
	.morpheme-list,
	.inflection-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.morpheme-item {
		padding: var(--space-4);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	
	.morpheme-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}
	
	.morpheme-form {
		font-size: var(--size-lg);
		font-weight: 600;
		font-family: monospace;
	}
	
	.morpheme-gloss {
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		margin-left: auto;
	}
	
	.morpheme-desc,
	.inflection-desc {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: var(--space-2) 0;
	}
	
	.morpheme-condition,
	.morpheme-allomorphs {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
		margin: var(--space-1) 0;
	}
	
	.morpheme-condition code {
		background: var(--color-bg-tertiary);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
	}
	
	.morpheme-meaning {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-top: var(--space-2);
	}
	
	.morpheme-actions,
	.inflection-actions {
		display: flex;
		gap: var(--space-1);
		margin-top: var(--space-3);
	}
	
	.paradigm-table {
		margin: var(--space-4) 0;
		overflow-x: auto;
	}
	
	.paradigm-table table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--size-sm);
	}
	
	.paradigm-table th,
	.paradigm-table td {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		text-align: left;
	}
	
	.paradigm-table th {
		background: var(--color-bg-tertiary);
		font-weight: 500;
	}
	
	.form-cell {
		font-family: monospace;
		font-weight: 500;
	}
	
	.empty-paradigm {
		color: var(--color-text-tertiary);
		font-size: var(--size-sm);
		text-align: center;
		padding: var(--space-4);
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
	
	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
	}
	
</style>
