<script lang="ts">
	import { page } from '$app/stores';
	import { Card, Button, Input, Modal, Tabs, IPAKeyboard, Select, Badge, HelpTooltip } from '$lib/components/ui';
	import { currentLanguage } from '$lib/stores';
	import { 
		IPA_CONSONANTS, 
		IPA_VOWELS, 
		PLACES_OF_ARTICULATION, 
		MANNERS_OF_ARTICULATION,
		VOWEL_HEIGHTS,
		VOWEL_BACKNESS,
		getFeaturesBySymbol
	} from '$lib/engines/ipa';
	import { SoundChangeEngine } from '$lib/engines/sound-changes';
	
	const languageId = $derived($page.params.id);
	
	let activeSection = $state<'inventory' | 'allophones' | 'phonotactics' | 'sound-changes'>('inventory');
	
	let phonemeModalOpen = $state(false);
	let editingPhoneme = $state<Phoneme | null>(null);
	let phonemeForm = $state({
		symbol: '',
		ipa: '',
		type: 'consonant' as 'consonant' | 'vowel',
		romanization: '',
		description: ''
	});
	
	let allophoneModalOpen = $state(false);
	let editingAllophone = $state<Allophone | null>(null);
	let allophoneForm = $state({
		phonemeId: '',
		symbol: '',
		ipa: '',
		environment: '',
		environmentDescription: ''
	});
	
	let phonotacticModalOpen = $state(false);
	let editingPhonotactic = $state<Phonotactic | null>(null);
	let phonotacticForm = $state({
		name: '',
		pattern: '',
		description: '',
		syllablePosition: '',
		isRequired: false,
		examples: ''
	});
	
	let soundChangeModalOpen = $state(false);
	let editingSoundChange = $state<SoundChangeRule | null>(null);
	let soundChangeForm = $state({
		name: '',
		fromPattern: '',
		toPattern: '',
		environment: '',
		description: '',
		era: '',
		isActive: true,
		exceptions: ''
	});
	
	let soundChangeTestInput = $state('');
	let soundChangeTestResult = $state('');
	
	let saving = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	
	interface Phoneme {
		id: string;
		symbol: string;
		type: 'consonant' | 'vowel';
		ipa: string;
		romanization?: string;
		features?: Record<string, unknown>;
		description?: string;
	}
	
	interface Allophone {
		id: string;
		phonemeId: string;
		symbol: string;
		ipa: string;
		environment: string;
		environmentDescription?: string;
	}
	
	interface Phonotactic {
		id: string;
		name: string;
		pattern: string;
		description?: string;
		syllablePosition?: string;
		isRequired?: boolean;
		examples?: string[];
	}
	
	interface SoundChangeRule {
		id: string;
		name: string;
		fromPattern: string;
		toPattern: string;
		environment?: string;
		description?: string;
		orderIndex?: number;
		isActive?: boolean;
		era?: string;
		exceptions?: string[];
	}
	
	const phonemes = $derived(($currentLanguage?.phonemes ?? []) as Phoneme[]);
	const allophones = $derived(($currentLanguage?.allophones ?? []) as Allophone[]);
	const phonotactics = $derived(($currentLanguage?.phonotactics ?? []) as Phonotactic[]);
	const soundChanges = $derived(($currentLanguage?.soundChanges ?? []) as SoundChangeRule[]);
	
	const consonants = $derived(phonemes.filter(p => p.type === 'consonant'));
	const vowels = $derived(phonemes.filter(p => p.type === 'vowel'));
	
	const consonantPlaces = ['bilabial', 'labiodental', 'dental', 'alveolar', 'postalveolar', 'retroflex', 'palatal', 'velar', 'uvular', 'pharyngeal', 'glottal', 'labial-velar', 'labial-palatal'] as const;
	const consonantManners = ['plosive', 'nasal', 'trill', 'tap', 'fricative', 'lateral-fricative', 'approximant', 'lateral-approximant', 'affricate'] as const;
	
	function getConsonantAt(manner: string, place: string, voiced: boolean): Phoneme | undefined {
		return consonants.find(p => {
			const features = getFeaturesBySymbol(p.ipa);
			if (!features || features.type !== 'consonant') return false;
			return features.features.manner === manner && 
				   features.features.place === place && 
				   (voiced ? features.features.voicing === 'voiced' : features.features.voicing === 'voiceless');
		});
	}
	
	// Get consonants that don't fit in the standard grid
	const otherConsonants = $derived(() => {
		const gridPlaces = new Set<string>(consonantPlaces);
		const gridManners = new Set<string>(consonantManners);
		
		return consonants.filter(p => {
			const features = getFeaturesBySymbol(p.ipa);
			if (!features || features.type !== 'consonant') return true;
			return !gridPlaces.has(features.features.place) || !gridManners.has(features.features.manner);
		});
	});
	
	function getVowelAt(height: string, backness: string, rounded: boolean): Phoneme | undefined {
		return vowels.find(p => {
			const features = getFeaturesBySymbol(p.ipa);
			if (!features || features.type !== 'vowel') return false;
			return features.features.height === height && 
				   features.features.backness === backness && 
				   (rounded ? features.features.roundedness === 'rounded' : features.features.roundedness === 'unrounded');
		});
	}
	
	function openPhonemeModal(phoneme?: Phoneme) {
		if (phoneme) {
			editingPhoneme = phoneme;
			phonemeForm = {
				symbol: phoneme.symbol,
				ipa: phoneme.ipa,
				type: phoneme.type,
				romanization: phoneme.romanization ?? '',
				description: phoneme.description ?? ''
			};
		} else {
			editingPhoneme = null;
			phonemeForm = {
				symbol: '',
				ipa: '',
				type: 'consonant',
				romanization: '',
				description: ''
			};
		}
		phonemeModalOpen = true;
	}
	
	function handleIPASelect(symbol: string) {
		phonemeForm.ipa += symbol;
		if (!phonemeForm.symbol) {
			phonemeForm.symbol = phonemeForm.ipa;
		}
		const features = getFeaturesBySymbol(symbol);
		if (features && (features.type === 'consonant' || features.type === 'vowel')) {
			phonemeForm.type = features.type;
		}
	}
	
	function handleAllophoneIPASelect(symbol: string) {
		allophoneForm.ipa += symbol;
		if (!allophoneForm.symbol) {
			allophoneForm.symbol = allophoneForm.ipa;
		}
	}
	
	async function savePhoneme() {
		saving = true;
		try {
			const features = getFeaturesBySymbol(phonemeForm.ipa);
			const payload = {
				symbol: phonemeForm.symbol,
				ipa: phonemeForm.ipa,
				type: phonemeForm.type,
				romanization: phonemeForm.romanization || null,
				description: phonemeForm.description || null,
				features: features?.features ?? null
			};
			
			if (editingPhoneme) {
				await fetch(`/api/languages/${languageId}/phonemes/${editingPhoneme.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				await fetch(`/api/languages/${languageId}/phonemes`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			
			await currentLanguage.load(languageId);
			phonemeModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deletePhoneme(id: string) {
		await fetch(`/api/languages/${languageId}/phonemes/${id}`, { method: 'DELETE' });
		await currentLanguage.load(languageId);
		deleteConfirmId = null;
	}
	
	function openAllophoneModal(allophone?: Allophone) {
		if (allophone) {
			editingAllophone = allophone;
			allophoneForm = {
				phonemeId: allophone.phonemeId,
				symbol: allophone.symbol,
				ipa: allophone.ipa,
				environment: allophone.environment,
				environmentDescription: allophone.environmentDescription ?? ''
			};
		} else {
			editingAllophone = null;
			allophoneForm = {
				phonemeId: phonemes[0]?.id ?? '',
				symbol: '',
				ipa: '',
				environment: '',
				environmentDescription: ''
			};
		}
		allophoneModalOpen = true;
	}
	
	async function saveAllophone() {
		saving = true;
		try {
			const payload = {
				phonemeId: allophoneForm.phonemeId,
				symbol: allophoneForm.symbol,
				ipa: allophoneForm.ipa,
				environment: allophoneForm.environment,
				environmentDescription: allophoneForm.environmentDescription || null
			};
			
			if (editingAllophone) {
				await fetch(`/api/languages/${languageId}/allophones/${editingAllophone.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				await fetch(`/api/languages/${languageId}/allophones`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			
			await currentLanguage.load(languageId);
			allophoneModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteAllophone(id: string) {
		await fetch(`/api/languages/${languageId}/allophones/${id}`, { method: 'DELETE' });
		await currentLanguage.load(languageId);
		deleteConfirmId = null;
	}
	
	function openPhonotacticModal(phonotactic?: Phonotactic) {
		if (phonotactic) {
			editingPhonotactic = phonotactic;
			phonotacticForm = {
				name: phonotactic.name,
				pattern: phonotactic.pattern,
				description: phonotactic.description ?? '',
				syllablePosition: phonotactic.syllablePosition ?? '',
				isRequired: phonotactic.isRequired ?? false,
				examples: phonotactic.examples?.join(', ') ?? ''
			};
		} else {
			editingPhonotactic = null;
			phonotacticForm = {
				name: '',
				pattern: '',
				description: '',
				syllablePosition: '',
				isRequired: false,
				examples: ''
			};
		}
		phonotacticModalOpen = true;
	}
	
	async function savePhonotactic() {
		saving = true;
		try {
			const payload = {
				name: phonotacticForm.name,
				pattern: phonotacticForm.pattern,
				description: phonotacticForm.description || null,
				syllablePosition: phonotacticForm.syllablePosition || null,
				isRequired: phonotacticForm.isRequired,
				examples: phonotacticForm.examples ? phonotacticForm.examples.split(',').map(e => e.trim()).filter(Boolean) : null
			};
			
			if (editingPhonotactic) {
				await fetch(`/api/languages/${languageId}/phonotactics/${editingPhonotactic.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				await fetch(`/api/languages/${languageId}/phonotactics`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			
			await currentLanguage.load(languageId);
			phonotacticModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deletePhonotactic(id: string) {
		await fetch(`/api/languages/${languageId}/phonotactics/${id}`, { method: 'DELETE' });
		await currentLanguage.load(languageId);
		deleteConfirmId = null;
	}
	
	function openSoundChangeModal(soundChange?: SoundChangeRule) {
		if (soundChange) {
			editingSoundChange = soundChange;
			soundChangeForm = {
				name: soundChange.name,
				fromPattern: soundChange.fromPattern,
				toPattern: soundChange.toPattern,
				environment: soundChange.environment ?? '',
				description: soundChange.description ?? '',
				era: soundChange.era ?? '',
				isActive: soundChange.isActive ?? true,
				exceptions: (soundChange.exceptions ?? []).join(', ')
			};
		} else {
			editingSoundChange = null;
			soundChangeForm = {
				name: '',
				fromPattern: '',
				toPattern: '',
				environment: '',
				description: '',
				era: '',
				isActive: true,
				exceptions: ''
			};
		}
		soundChangeModalOpen = true;
	}
	
	async function saveSoundChange() {
		saving = true;
		try {
			const exceptionsArray = soundChangeForm.exceptions
				.split(',')
				.map(e => e.trim())
				.filter(Boolean);
			
			const payload = {
				name: soundChangeForm.name,
				fromPattern: soundChangeForm.fromPattern,
				toPattern: soundChangeForm.toPattern,
				environment: soundChangeForm.environment || null,
				description: soundChangeForm.description || null,
				era: soundChangeForm.era || null,
				isActive: soundChangeForm.isActive,
				orderIndex: editingSoundChange?.orderIndex ?? soundChanges.length,
				exceptions: exceptionsArray.length > 0 ? exceptionsArray : null
			};
			
			if (editingSoundChange) {
				await fetch(`/api/languages/${languageId}/sound-changes/${editingSoundChange.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				await fetch(`/api/languages/${languageId}/sound-changes`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			
			await currentLanguage.load(languageId);
			soundChangeModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteSoundChange(id: string) {
		await fetch(`/api/languages/${languageId}/sound-changes/${id}`, { method: 'DELETE' });
		await currentLanguage.load(languageId);
		deleteConfirmId = null;
	}
	
	function testSoundChanges() {
		if (!soundChangeTestInput.trim()) {
			soundChangeTestResult = '';
			return;
		}
		
		const engine = new SoundChangeEngine();
		const result = engine.applyChanges(soundChangeTestInput, soundChanges.filter(sc => sc.isActive !== false));
		soundChangeTestResult = result.result;
	}
	
	function formatSoundChange(sc: SoundChangeRule): string {
		let formatted = `${sc.fromPattern} → ${sc.toPattern || '∅'}`;
		if (sc.environment) {
			formatted += ` / ${sc.environment}`;
		}
		return formatted;
	}
	
	function getPhonemeById(id: string): Phoneme | undefined {
		return phonemes.find(p => p.id === id);
	}
	
	const sections = [
		{ id: 'inventory', label: 'Phoneme Inventory' },
		{ id: 'allophones', label: 'Allophones' },
		{ id: 'phonotactics', label: 'Phonotactics' },
		{ id: 'sound-changes', label: 'Sound Changes' }
	];
</script>

<div class="phonology-page">
	<Tabs 
		tabs={sections} 
		activeTab={activeSection} 
		ontabchange={(id) => activeSection = id as typeof activeSection}
	>
		{#if activeSection === 'inventory'}
			<div class="section">
				<div class="section-header">
					<h2>Phoneme Inventory</h2>
					<Button variant="primary" onclick={() => openPhonemeModal()}>Add Phoneme</Button>
				</div>
				
				<Card title="Consonants ({consonants.length})">
					<div class="consonant-chart">
						<table>
							<thead>
								<tr>
									<th></th>
									{#each consonantPlaces as place}
										<th colspan="2">{place}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each consonantManners as manner}
									<tr>
										<th class="manner-label">{manner}</th>
										{#each consonantPlaces as place}
											{@const voiceless = getConsonantAt(manner, place, false)}
											{@const voiced = getConsonantAt(manner, place, true)}
											<td class="phoneme-cell">
												{#if voiceless}
													<button 
														class="phoneme-btn" 
														onclick={() => openPhonemeModal(voiceless)}
														title={voiceless.romanization ? `/${voiceless.ipa}/ → ${voiceless.romanization}` : `/${voiceless.ipa}/`}
													>
														{voiceless.ipa}
													</button>
												{/if}
											</td>
											<td class="phoneme-cell">
												{#if voiced}
													<button 
														class="phoneme-btn" 
														onclick={() => openPhonemeModal(voiced)}
														title={voiced.romanization ? `/${voiced.ipa}/ → ${voiced.romanization}` : `/${voiced.ipa}/`}
													>
														{voiced.ipa}
													</button>
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if otherConsonants().length > 0}
						<div class="other-phonemes">
							<div class="other-label">Other consonants</div>
							<div class="other-grid">
								{#each otherConsonants() as phoneme}
									<button 
										class="phoneme-btn" 
										onclick={() => openPhonemeModal(phoneme)}
										title={phoneme.romanization ? `/${phoneme.ipa}/ → ${phoneme.romanization}` : `/${phoneme.ipa}/`}
									>
										{phoneme.ipa}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</Card>
				
				<Card title="Vowels ({vowels.length})">
					<div class="vowel-chart">
						<table>
							<thead>
								<tr>
									<th></th>
									{#each VOWEL_BACKNESS as backness}
										<th colspan="2">{backness}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each VOWEL_HEIGHTS as height}
									<tr>
										<th class="height-label">{height}</th>
										{#each VOWEL_BACKNESS as backness}
											{@const unrounded = getVowelAt(height, backness, false)}
											{@const rounded = getVowelAt(height, backness, true)}
											<td class="phoneme-cell">
												{#if unrounded}
													<button 
														class="phoneme-btn" 
														onclick={() => openPhonemeModal(unrounded)}
														title={unrounded.romanization ? `/${unrounded.ipa}/ → ${unrounded.romanization}` : `/${unrounded.ipa}/`}
													>
														{unrounded.ipa}
													</button>
												{/if}
											</td>
											<td class="phoneme-cell">
												{#if rounded}
													<button 
														class="phoneme-btn" 
														onclick={() => openPhonemeModal(rounded)}
														title={rounded.romanization ? `/${rounded.ipa}/ → ${rounded.romanization}` : `/${rounded.ipa}/`}
													>
														{rounded.ipa}
													</button>
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</Card>
				
				<Card title="All Phonemes">
					<div class="phoneme-list">
						{#each phonemes as phoneme}
							<div class="phoneme-item">
								<span class="phoneme-symbol">{phoneme.ipa}</span>
								<span class="phoneme-type">{phoneme.type}</span>
								{#if phoneme.romanization}
									<span class="phoneme-roman">→ {phoneme.romanization}</span>
								{/if}
								<div class="phoneme-actions">
									<Button size="sm" variant="ghost" onclick={() => openPhonemeModal(phoneme)}>Edit</Button>
									<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = phoneme.id}>Delete</Button>
								</div>
							</div>
						{:else}
							<p class="empty-message">No phonemes defined yet. Click "Add Phoneme" to get started.</p>
						{/each}
					</div>
				</Card>
			</div>
		{:else if activeSection === 'allophones'}
			<div class="section">
				<div class="section-header">
					<h2>Allophones</h2>
					<Button variant="primary" onclick={() => openAllophoneModal()} disabled={phonemes.length === 0}>
						Add Allophone
					</Button>
				</div>
				
				{#if phonemes.length === 0}
					<Card>
						<p class="empty-message">Add phonemes first before defining allophones.</p>
					</Card>
				{:else}
					<Card>
						<div class="allophone-list">
							{#each allophones as allophone}
								{@const parentPhoneme = getPhonemeById(allophone.phonemeId)}
								<div class="allophone-item">
									<div class="allophone-info">
										<span class="allophone-parent">/{parentPhoneme?.ipa ?? '?'}/</span>
										<span class="allophone-arrow">→</span>
										<span class="allophone-symbol">[{allophone.ipa}]</span>
										<span class="allophone-env">/ {allophone.environment}</span>
									</div>
									{#if allophone.environmentDescription}
										<p class="allophone-desc">{allophone.environmentDescription}</p>
									{/if}
									<div class="allophone-actions">
										<Button size="sm" variant="ghost" onclick={() => openAllophoneModal(allophone)}>Edit</Button>
										<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `allophone-${allophone.id}`}>Delete</Button>
									</div>
								</div>
							{:else}
								<p class="empty-message">No allophones defined yet.</p>
							{/each}
						</div>
					</Card>
				{/if}
			</div>
		{:else if activeSection === 'phonotactics'}
			<div class="section">
				<div class="section-header">
					<h2>Phonotactics</h2>
					<Button variant="primary" onclick={() => openPhonotacticModal()}>Add Rule</Button>
				</div>
				
				<Card title="Syllable Structure Rules">
					<div class="phonotactic-list">
						{#each phonotactics as rule}
							<div class="phonotactic-item">
								<div class="phonotactic-header">
									<span class="phonotactic-name">{rule.name}</span>
									{#if rule.syllablePosition}
										<Badge label={rule.syllablePosition} />
									{/if}
									{#if rule.isRequired}
										<Badge label="Required" />
									{/if}
								</div>
								<code class="phonotactic-pattern">{rule.pattern}</code>
								{#if rule.description}
									<p class="phonotactic-desc">{rule.description}</p>
								{/if}
								{#if rule.examples?.length}
									<div class="phonotactic-examples">
										Examples: {rule.examples.join(', ')}
									</div>
								{/if}
								<div class="phonotactic-actions">
									<Button size="sm" variant="ghost" onclick={() => openPhonotacticModal(rule)}>Edit</Button>
									<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `phonotactic-${rule.id}`}>Delete</Button>
								</div>
							</div>
						{:else}
							<p class="empty-message">No phonotactic rules defined yet.</p>
						{/each}
					</div>
				</Card>
				
				<Card title="Pattern Reference">
					<div class="pattern-help">
						<p>Use these symbols in patterns:</p>
						<ul>
							<li><code>C</code> - Any consonant</li>
							<li><code>V</code> - Any vowel</li>
							<li><code>N</code> - Any nasal</li>
							<li><code>P</code> - Any plosive</li>
							<li><code>F</code> - Any fricative</li>
							<li><code>L</code> - Any lateral</li>
							<li><code>R</code> - Any rhotic</li>
							<li><code>G</code> - Any glide</li>
							<li><code>(X)</code> - Optional X</li>
							<li><code>#</code> - Word boundary</li>
						</ul>
						<p>Example: <code>(C)(C)V(C)</code> allows CV, CCV, CVC, CCVC syllables</p>
					</div>
				</Card>
			</div>
		{:else if activeSection === 'sound-changes'}
			<div class="section">
				<div class="section-header">
					<h2>Sound Changes</h2>
					<Button variant="primary" onclick={() => openSoundChangeModal()}>Add Rule</Button>
				</div>
				
				<Card title="Test Sound Changes">
					<div class="sound-change-tester">
						<div class="tester-input">
							<Input 
								bind:value={soundChangeTestInput} 
								placeholder="Enter word to test..."
								onkeydown={(e) => e.key === 'Enter' && testSoundChanges()}
							/>
							<Button onclick={testSoundChanges}>Apply</Button>
						</div>
						{#if soundChangeTestResult}
							<div class="tester-result">
								<span class="result-label">Result:</span>
								<span class="result-value">{soundChangeTestInput} → {soundChangeTestResult}</span>
							</div>
						{/if}
					</div>
				</Card>
				
				<Card title="Sound Change Rules">
					<div class="sound-change-list">
						{#each soundChanges.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) as rule, index}
							<div class="sound-change-item" class:inactive={!rule.isActive}>
								<div class="sound-change-header">
									<span class="sound-change-order">{index + 1}.</span>
									<span class="sound-change-name">{rule.name}</span>
									{#if rule.era}
										<Badge label={rule.era} />
									{/if}
									{#if !rule.isActive}
										<Badge label="Inactive" />
									{/if}
								</div>
								<code class="sound-change-rule">{formatSoundChange(rule)}</code>
								{#if rule.description}
									<p class="sound-change-desc">{rule.description}</p>
								{/if}
								<div class="sound-change-actions">
									<Button size="sm" variant="ghost" onclick={() => openSoundChangeModal(rule)}>Edit</Button>
									<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = `sc-${rule.id}`}>Delete</Button>
								</div>
							</div>
						{:else}
							<p class="empty-message">No sound changes defined yet.</p>
						{/each}
					</div>
				</Card>
				
				<Card title="Pattern Reference">
					<div class="pattern-help">
						<p>Sound change notation:</p>
						<ul>
							<li><code>a → b</code> - a becomes b</li>
							<li><code>a → ∅</code> - a is deleted</li>
							<li><code>a → b / C_V</code> - a becomes b between consonant and vowel</li>
							<li><code>a → b / #_</code> - a becomes b word-initially</li>
							<li><code>a → b / _#</code> - a becomes b word-finally</li>
						</ul>
						<p>Feature classes: C (consonant), V (vowel), N (nasal), P (plosive), F (fricative), etc.</p>
					</div>
				</Card>
			</div>
		{/if}
	</Tabs>
</div>

<Modal 
	bind:open={phonemeModalOpen} 
	title={editingPhoneme ? 'Edit Phoneme' : 'Add Phoneme'}
	size="lg"
	onclose={() => phonemeModalOpen = false}
>
	<div class="form">
		<div class="form-row">
			<div class="form-group">
				<label for="phoneme-type">Type</label>
				<Select 
					id="phoneme-type"
					options={[
						{ value: 'consonant', label: 'Consonant' },
						{ value: 'vowel', label: 'Vowel' }
					]}
					bind:value={phonemeForm.type}
				/>
			</div>
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="phoneme-ipa">IPA Symbol <HelpTooltip key="phonemeSymbol" inline /></label>
				<Input id="phoneme-ipa" bind:value={phonemeForm.ipa} placeholder="e.g. p, t, k..." />
			</div>
			<div class="form-group">
				<label for="phoneme-symbol">Display Symbol</label>
				<Input id="phoneme-symbol" bind:value={phonemeForm.symbol} placeholder="Usually same as IPA" />
			</div>
		</div>
		
		<div class="form-group">
			<label for="phoneme-roman">Romanization <HelpTooltip key="phonemeRomanization" inline /></label>
			<Input id="phoneme-roman" bind:value={phonemeForm.romanization} placeholder="How to write in Latin script" />
		</div>
		
		<div class="form-group">
			<span class="form-label">IPA Keyboard</span>
			<IPAKeyboard 
				onselect={handleIPASelect}
				showConsonants={phonemeForm.type === 'consonant'}
				showVowels={phonemeForm.type === 'vowel'}
			/>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => phonemeModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={savePhoneme} loading={saving} disabled={!phonemeForm.ipa}>
			{editingPhoneme ? 'Update' : 'Add'} Phoneme
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={allophoneModalOpen} 
	title={editingAllophone ? 'Edit Allophone' : 'Add Allophone'}
	size="lg"
	onclose={() => allophoneModalOpen = false}
>
	<div class="form">
		<div class="form-group">
			<label for="allophone-phoneme">Parent Phoneme <HelpTooltip key="allophonePhoneme" inline /></label>
			<Select 
				id="allophone-phoneme"
				options={phonemes.map(p => ({ value: p.id, label: `/${p.ipa}/` }))}
				bind:value={allophoneForm.phonemeId}
			/>
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="allophone-ipa">Allophone IPA <HelpTooltip key="phonemeSymbol" inline /></label>
				<Input id="allophone-ipa" bind:value={allophoneForm.ipa} placeholder="e.g. pʰ" />
			</div>
			<div class="form-group">
				<label for="allophone-symbol">Display Symbol</label>
				<Input id="allophone-symbol" bind:value={allophoneForm.symbol} placeholder="Usually same as IPA" />
			</div>
		</div>
		
		<div class="form-group">
			<label for="allophone-env">Environment <HelpTooltip key="allophoneEnvironment" inline /></label>
			<Input id="allophone-env" bind:value={allophoneForm.environment} placeholder="e.g. _V (before vowel)" />
			<span class="form-hint">Use _ for the phoneme position, # for word boundary</span>
		</div>
		
		<div class="form-group">
			<label for="allophone-desc">Description</label>
			<Input id="allophone-desc" bind:value={allophoneForm.environmentDescription} placeholder="e.g. Word-initially before a vowel" />
		</div>
		
		<div class="form-group">
			<span class="form-label">IPA Keyboard</span>
			<IPAKeyboard onselect={handleAllophoneIPASelect} />
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => allophoneModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveAllophone} loading={saving} disabled={!allophoneForm.ipa || !allophoneForm.phonemeId}>
			{editingAllophone ? 'Update' : 'Add'} Allophone
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={phonotacticModalOpen} 
	title={editingPhonotactic ? 'Edit Phonotactic Rule' : 'Add Phonotactic Rule'}
	size="md"
	onclose={() => phonotacticModalOpen = false}
>
	<div class="form">
		<div class="form-group">
			<label for="phonotactic-name">Rule Name</label>
			<Input id="phonotactic-name" bind:value={phonotacticForm.name} placeholder="e.g. Basic Syllable Structure" />
		</div>
		
		<div class="form-group">
			<label for="phonotactic-pattern">Pattern <HelpTooltip key="phonotacticPattern" inline /></label>
			<Input id="phonotactic-pattern" bind:value={phonotacticForm.pattern} placeholder="e.g. (C)(C)V(C)" />
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="phonotactic-position">Syllable Position <HelpTooltip key="phonotacticPosition" inline /></label>
				<Select 
					id="phonotactic-position"
					options={[
						{ value: '', label: 'Any' },
						{ value: 'onset', label: 'Onset' },
						{ value: 'nucleus', label: 'Nucleus' },
						{ value: 'coda', label: 'Coda' }
					]}
					bind:value={phonotacticForm.syllablePosition}
				/>
			</div>
			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={phonotacticForm.isRequired} />
					Required
				</label>
			</div>
		</div>
		
		<div class="form-group">
			<label for="phonotactic-desc">Description</label>
			<Input id="phonotactic-desc" bind:value={phonotacticForm.description} placeholder="Describe the rule..." />
		</div>
		
		<div class="form-group">
			<label for="phonotactic-examples">Examples (comma-separated)</label>
			<Input id="phonotactic-examples" bind:value={phonotacticForm.examples} placeholder="e.g. ka, tra, san" />
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => phonotacticModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={savePhonotactic} loading={saving} disabled={!phonotacticForm.name || !phonotacticForm.pattern}>
			{editingPhonotactic ? 'Update' : 'Add'} Rule
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={soundChangeModalOpen} 
	title={editingSoundChange ? 'Edit Sound Change' : 'Add Sound Change'}
	size="md"
	onclose={() => soundChangeModalOpen = false}
>
	<div class="form">
		<div class="form-group">
			<label for="sc-name">Rule Name</label>
			<Input id="sc-name" bind:value={soundChangeForm.name} placeholder="e.g. Grimm's Law" />
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="sc-from">From Pattern <HelpTooltip key="soundChangeFrom" inline /></label>
				<Input id="sc-from" bind:value={soundChangeForm.fromPattern} placeholder="e.g. p" />
			</div>
			<div class="form-group">
				<label for="sc-to">To Pattern <HelpTooltip key="soundChangeTo" inline /></label>
				<Input id="sc-to" bind:value={soundChangeForm.toPattern} placeholder="e.g. f (or ∅ for deletion)" />
			</div>
		</div>
		
		<div class="form-group">
			<label for="sc-env">Environment <HelpTooltip key="soundChangeEnvironment" inline /></label>
			<Input id="sc-env" bind:value={soundChangeForm.environment} placeholder="e.g. V_V (between vowels)" />
			<span class="form-hint">Use _ for target position, # for word boundary</span>
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="sc-era">Era/Period <HelpTooltip key="soundChangeEra" inline /></label>
				<Input id="sc-era" bind:value={soundChangeForm.era} placeholder="e.g. Proto-Language" />
			</div>
			<div class="form-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={soundChangeForm.isActive} />
					Active
				</label>
			</div>
		</div>
		
		<div class="form-group">
			<label for="sc-desc">Description</label>
			<Input id="sc-desc" bind:value={soundChangeForm.description} placeholder="Describe the change..." />
		</div>
		
		<div class="form-group">
			<label for="sc-exceptions">Exceptions (comma-separated)</label>
			<Input id="sc-exceptions" bind:value={soundChangeForm.exceptions} placeholder="e.g. kapa, taka, manu" />
			<span class="form-hint">Words that should be exempt from this sound change</span>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => soundChangeModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveSoundChange} loading={saving} disabled={!soundChangeForm.name || !soundChangeForm.fromPattern}>
			{editingSoundChange ? 'Update' : 'Add'} Rule
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
				if (deleteConfirmId?.startsWith('allophone-')) {
					deleteAllophone(deleteConfirmId.replace('allophone-', ''));
				} else if (deleteConfirmId?.startsWith('phonotactic-')) {
					deletePhonotactic(deleteConfirmId.replace('phonotactic-', ''));
				} else if (deleteConfirmId?.startsWith('sc-')) {
					deleteSoundChange(deleteConfirmId.replace('sc-', ''));
				} else if (deleteConfirmId) {
					deletePhoneme(deleteConfirmId);
				}
			}}
		>
			Delete
		</Button>
	{/snippet}
</Modal>

<style>
	.phonology-page {
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
	
	.consonant-chart,
	.vowel-chart {
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}
	
	.consonant-chart::-webkit-scrollbar,
	.vowel-chart::-webkit-scrollbar {
		height: 8px;
	}
	
	.consonant-chart::-webkit-scrollbar-track,
	.vowel-chart::-webkit-scrollbar-track {
		background: transparent;
		border-radius: var(--radius-sm);
	}
	
	.consonant-chart::-webkit-scrollbar-thumb,
	.vowel-chart::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: var(--radius-sm);
	}
	
	.consonant-chart::-webkit-scrollbar-thumb:hover,
	.vowel-chart::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-tertiary);
	}
	
	.consonant-chart table,
	.vowel-chart table {
		border-collapse: collapse;
		font-size: var(--size-sm);
		width: 100%;
	}
	
	.consonant-chart th,
	.vowel-chart th {
		padding: var(--space-2);
		font-weight: 500;
		text-align: center;
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}
	
	.manner-label,
	.height-label {
		text-align: right !important;
		padding-right: var(--space-3) !important;
		white-space: nowrap;
	}
	
	.phoneme-cell {
		padding: var(--space-1);
		text-align: center;
		border: 1px solid var(--color-border);
		min-width: 32px;
	}
	
	.phoneme-btn {
		min-width: 28px;
		height: 28px;
		padding: 0 var(--space-2);
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: var(--size-md);
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.phoneme-btn:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-border-focus);
	}
	
	.other-phonemes {
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}
	
	.other-label {
		font-size: var(--size-xs);
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-bottom: var(--space-2);
	}
	
	.other-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	
	.phoneme-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.phoneme-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.phoneme-symbol {
		font-size: var(--size-lg);
		font-weight: 500;
		min-width: 40px;
	}
	
	.phoneme-type {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}
	
	.phoneme-roman {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
	}
	
	.phoneme-actions {
		margin-left: auto;
		display: flex;
		gap: var(--space-1);
	}
	
	.empty-message {
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--space-8);
	}
	
	.allophone-list,
	.phonotactic-list,
	.sound-change-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.allophone-item,
	.phonotactic-item,
	.sound-change-item {
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.allophone-info {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--size-md);
	}
	
	.allophone-parent {
		font-weight: 500;
	}
	
	.allophone-arrow {
		color: var(--color-text-tertiary);
	}
	
	.allophone-symbol {
		font-weight: 500;
	}
	
	.allophone-env {
		color: var(--color-text-secondary);
		font-family: monospace;
	}
	
	.allophone-desc,
	.phonotactic-desc,
	.sound-change-desc {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: var(--space-2) 0;
	}
	
	.allophone-actions,
	.phonotactic-actions,
	.sound-change-actions {
		display: flex;
		gap: var(--space-1);
		margin-top: var(--space-2);
	}
	
	.phonotactic-header,
	.sound-change-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}
	
	.phonotactic-name,
	.sound-change-name {
		font-weight: 500;
	}
	
	.phonotactic-pattern,
	.sound-change-rule {
		display: block;
		font-family: monospace;
		font-size: var(--size-md);
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
	}
	
	.phonotactic-examples {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin-top: var(--space-2);
	}
	
	.sound-change-order {
		color: var(--color-text-tertiary);
		font-size: var(--size-sm);
	}
	
	.sound-change-item.inactive {
		opacity: 0.6;
	}
	
	.sound-change-tester {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.tester-input {
		display: flex;
		gap: var(--space-2);
	}
	
	.tester-input :global(.input-wrapper) {
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
	
	.form-group label,
	.form-group .form-label {
		font-size: var(--size-sm);
		font-weight: 500;
	}
	
	.form-hint {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
	}
	
	.checkbox-group {
		justify-content: flex-end;
	}
	
	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
	}
	
	.checkbox-group input[type="checkbox"] {
		width: 16px;
		height: 16px;
	}
</style>
