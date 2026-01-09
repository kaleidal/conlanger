<script lang="ts">
	import { IPA_CONSONANTS, IPA_VOWELS, IPA_DIACRITICS, PLACES_OF_ARTICULATION, MANNERS_OF_ARTICULATION, VOWEL_HEIGHTS, VOWEL_BACKNESS } from '$lib/engines/ipa';
	
	interface Props {
		onselect: (symbol: string) => void;
		showConsonants?: boolean;
		showVowels?: boolean;
		showDiacritics?: boolean;
	}
	
	let {
		onselect,
		showConsonants = true,
		showVowels = true,
		showDiacritics = true
	}: Props = $props();
	
	let activeTab = $state<'consonants' | 'vowels' | 'diacritics'>('consonants');
	
	function getConsonantGrid() {
		const grid: Map<string, Map<string, { voiceless?: string; voiced?: string }>> = new Map();
		
		for (const manner of MANNERS_OF_ARTICULATION) {
			grid.set(manner, new Map());
			for (const place of PLACES_OF_ARTICULATION) {
				grid.get(manner)!.set(place, {});
			}
		}
		
		for (const consonant of IPA_CONSONANTS) {
			const manner = consonant.features.manner;
			const place = consonant.features.place;
			const voicing = consonant.features.voicing;
			
			if (manner && place && grid.has(manner)) {
				const placeMap = grid.get(manner)!;
				if (placeMap.has(place)) {
					const cell = placeMap.get(place)!;
					if (voicing === 'voiceless') {
						cell.voiceless = consonant.symbol;
					} else {
						cell.voiced = consonant.symbol;
					}
				}
			}
		}
		
		return grid;
	}
	
	function getVowelGrid() {
		const grid: Map<string, Map<string, { unrounded?: string; rounded?: string }>> = new Map();
		
		for (const height of VOWEL_HEIGHTS) {
			grid.set(height, new Map());
			for (const backness of VOWEL_BACKNESS) {
				grid.get(height)!.set(backness, {});
			}
		}
		
		for (const vowel of IPA_VOWELS) {
			const height = vowel.features.height;
			const backness = vowel.features.backness;
			const roundedness = vowel.features.roundedness;
			
			if (height && backness && grid.has(height)) {
				const backnessMap = grid.get(height)!;
				if (backnessMap.has(backness)) {
					const cell = backnessMap.get(backness)!;
					if (roundedness === 'rounded') {
						cell.rounded = vowel.symbol;
					} else {
						cell.unrounded = vowel.symbol;
					}
				}
			}
		}
		
		return grid;
	}
	
	const consonantGrid = getConsonantGrid();
	const vowelGrid = getVowelGrid();
	const places = PLACES_OF_ARTICULATION.filter(p => 
		['bilabial', 'labiodental', 'dental', 'alveolar', 'postalveolar', 'retroflex', 'palatal', 'velar', 'uvular', 'pharyngeal', 'glottal', 'labial-velar', 'labial-palatal'].includes(p)
	);
	const manners = MANNERS_OF_ARTICULATION;
	
	// Collect sounds that don't fit in the standard grid (co-articulated, affricates, etc.)
	function getOtherConsonants(): { symbol: string; name: string }[] {
		const gridPlaces = new Set<string>(places);
		const gridManners = new Set<string>(manners);
		
		return IPA_CONSONANTS
			.filter(c => !gridPlaces.has(c.features.place) || !gridManners.has(c.features.manner))
			.map(c => ({ symbol: c.symbol, name: `${c.features.manner} ${c.features.place}` }));
	}
	
	const otherConsonants = getOtherConsonants();
</script>

<div class="ipa-keyboard">
	<div class="tabs">
		{#if showConsonants}
			<button 
				class="tab" 
				class:active={activeTab === 'consonants'}
				onclick={() => activeTab = 'consonants'}
			>
				Consonants
			</button>
		{/if}
		{#if showVowels}
			<button 
				class="tab" 
				class:active={activeTab === 'vowels'}
				onclick={() => activeTab = 'vowels'}
			>
				Vowels
			</button>
		{/if}
		{#if showDiacritics}
			<button 
				class="tab" 
				class:active={activeTab === 'diacritics'}
				onclick={() => activeTab = 'diacritics'}
			>
				Diacritics
			</button>
		{/if}
	</div>
	
	<div class="content">
		{#if activeTab === 'consonants'}
			<div class="consonant-table">
				<table>
					<thead>
						<tr>
							<th></th>
							{#each places as place}
								<th colspan="2">{place}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each manners as manner}
							<tr>
								<th>{manner}</th>
								{#each places as place}
									{@const cell = consonantGrid.get(manner)?.get(place)}
									<td>
										{#if cell?.voiceless}
											<button class="ipa-btn" onclick={() => onselect(cell.voiceless!)}>
												{cell.voiceless}
											</button>
										{/if}
									</td>
									<td>
										{#if cell?.voiced}
											<button class="ipa-btn" onclick={() => onselect(cell.voiced!)}>
												{cell.voiced}
											</button>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if otherConsonants.length > 0}
				<div class="other-consonants">
					<div class="other-label">Other consonants</div>
					<div class="other-grid">
						{#each otherConsonants as consonant}
							<button class="ipa-btn" onclick={() => onselect(consonant.symbol)} title={consonant.name}>
								{consonant.symbol}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{:else if activeTab === 'vowels'}
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
								<th>{height}</th>
								{#each VOWEL_BACKNESS as backness}
									{@const cell = vowelGrid.get(height)?.get(backness)}
									<td>
										{#if cell?.unrounded}
											<button class="ipa-btn" onclick={() => onselect(cell.unrounded!)}>
												{cell.unrounded}
											</button>
										{/if}
									</td>
									<td>
										{#if cell?.rounded}
											<button class="ipa-btn" onclick={() => onselect(cell.rounded!)}>
												{cell.rounded}
											</button>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if activeTab === 'diacritics'}
			<div class="diacritics-grid">
				{#each IPA_DIACRITICS as diacritic}
					<button class="ipa-btn diacritic" onclick={() => onselect(diacritic.symbol)}>
						<span class="symbol">◌{diacritic.symbol}</span>
						<span class="name">{diacritic.name}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.ipa-keyboard {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	
	.tabs {
		display: flex;
		border-bottom: 1px solid var(--color-border);
	}
	
	.tab {
		flex: 1;
		padding: var(--space-3);
		background: transparent;
		border: none;
		font-size: var(--size-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.tab:hover {
		background: var(--color-bg-hover);
	}
	
	.tab.active {
		color: var(--color-text);
		background: var(--color-bg-tertiary);
	}
	
	.content {
		padding: var(--space-4);
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}
	
	.content::-webkit-scrollbar {
		height: 8px;
	}
	
	.content::-webkit-scrollbar-track {
		background: transparent;
		border-radius: var(--radius-sm);
	}
	
	.content::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: var(--radius-sm);
	}
	
	.content::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-tertiary);
	}
	
	table {
		border-collapse: collapse;
		font-size: var(--size-sm);
	}
	
	th {
		padding: var(--space-1) var(--space-2);
		font-weight: 500;
		text-align: center;
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
	}
	
	tbody th {
		text-align: right;
		padding-right: var(--space-3);
	}
	
	td {
		padding: var(--space-1);
		text-align: center;
	}
	
	.ipa-btn {
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
	
	.ipa-btn:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-border-focus);
	}
	
	.diacritics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: var(--space-2);
	}
	
	.diacritic {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-2);
		height: auto;
	}
	
	.diacritic .symbol {
		font-size: var(--size-lg);
	}
	
	.diacritic .name {
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
		margin-top: var(--space-1);
	}
	
	.other-consonants {
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
</style>
