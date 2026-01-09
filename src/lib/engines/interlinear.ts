export interface InterlinearMorpheme {
	surface: string;
	underlying?: string;
	gloss: string;
	wordId?: string;
}

export interface InterlinearWord {
	original: string;
	morphemes: InterlinearMorpheme[];
	translation?: string;
}

export interface InterlinearLine {
	words: InterlinearWord[];
	freeTranslation: string;
}

export interface InterlinearText {
	title: string;
	lines: InterlinearLine[];
	source?: string;
	notes?: string;
}

export interface GlossAbbreviation {
	abbreviation: string;
	meaning: string;
	category?: string;
}

export const STANDARD_GLOSS_ABBREVIATIONS: GlossAbbreviation[] = [
	{ abbreviation: '1', meaning: 'first person', category: 'person' },
	{ abbreviation: '2', meaning: 'second person', category: 'person' },
	{ abbreviation: '3', meaning: 'third person', category: 'person' },
	{ abbreviation: 'SG', meaning: 'singular', category: 'number' },
	{ abbreviation: 'PL', meaning: 'plural', category: 'number' },
	{ abbreviation: 'DU', meaning: 'dual', category: 'number' },
	{ abbreviation: 'PAUC', meaning: 'paucal', category: 'number' },
	{ abbreviation: 'M', meaning: 'masculine', category: 'gender' },
	{ abbreviation: 'F', meaning: 'feminine', category: 'gender' },
	{ abbreviation: 'N', meaning: 'neuter', category: 'gender' },
	{ abbreviation: 'NOM', meaning: 'nominative', category: 'case' },
	{ abbreviation: 'ACC', meaning: 'accusative', category: 'case' },
	{ abbreviation: 'GEN', meaning: 'genitive', category: 'case' },
	{ abbreviation: 'DAT', meaning: 'dative', category: 'case' },
	{ abbreviation: 'LOC', meaning: 'locative', category: 'case' },
	{ abbreviation: 'INS', meaning: 'instrumental', category: 'case' },
	{ abbreviation: 'ABL', meaning: 'ablative', category: 'case' },
	{ abbreviation: 'VOC', meaning: 'vocative', category: 'case' },
	{ abbreviation: 'ERG', meaning: 'ergative', category: 'case' },
	{ abbreviation: 'ABS', meaning: 'absolutive', category: 'case' },
	{ abbreviation: 'ALL', meaning: 'allative', category: 'case' },
	{ abbreviation: 'COM', meaning: 'comitative', category: 'case' },
	{ abbreviation: 'PRS', meaning: 'present', category: 'tense' },
	{ abbreviation: 'PST', meaning: 'past', category: 'tense' },
	{ abbreviation: 'FUT', meaning: 'future', category: 'tense' },
	{ abbreviation: 'NPST', meaning: 'non-past', category: 'tense' },
	{ abbreviation: 'REM', meaning: 'remote', category: 'tense' },
	{ abbreviation: 'IPFV', meaning: 'imperfective', category: 'aspect' },
	{ abbreviation: 'PFV', meaning: 'perfective', category: 'aspect' },
	{ abbreviation: 'PRF', meaning: 'perfect', category: 'aspect' },
	{ abbreviation: 'PROG', meaning: 'progressive', category: 'aspect' },
	{ abbreviation: 'HAB', meaning: 'habitual', category: 'aspect' },
	{ abbreviation: 'CONT', meaning: 'continuative', category: 'aspect' },
	{ abbreviation: 'INCH', meaning: 'inchoative', category: 'aspect' },
	{ abbreviation: 'IND', meaning: 'indicative', category: 'mood' },
	{ abbreviation: 'SBJV', meaning: 'subjunctive', category: 'mood' },
	{ abbreviation: 'IMP', meaning: 'imperative', category: 'mood' },
	{ abbreviation: 'COND', meaning: 'conditional', category: 'mood' },
	{ abbreviation: 'OPT', meaning: 'optative', category: 'mood' },
	{ abbreviation: 'POT', meaning: 'potential', category: 'mood' },
	{ abbreviation: 'IRR', meaning: 'irrealis', category: 'mood' },
	{ abbreviation: 'ACT', meaning: 'active', category: 'voice' },
	{ abbreviation: 'PASS', meaning: 'passive', category: 'voice' },
	{ abbreviation: 'MID', meaning: 'middle', category: 'voice' },
	{ abbreviation: 'CAUS', meaning: 'causative', category: 'voice' },
	{ abbreviation: 'APPL', meaning: 'applicative', category: 'voice' },
	{ abbreviation: 'REFL', meaning: 'reflexive', category: 'voice' },
	{ abbreviation: 'RECP', meaning: 'reciprocal', category: 'voice' },
	{ abbreviation: 'DEF', meaning: 'definite', category: 'definiteness' },
	{ abbreviation: 'INDEF', meaning: 'indefinite', category: 'definiteness' },
	{ abbreviation: 'SPEC', meaning: 'specific', category: 'definiteness' },
	{ abbreviation: 'NEG', meaning: 'negative', category: 'polarity' },
	{ abbreviation: 'Q', meaning: 'question', category: 'illocution' },
	{ abbreviation: 'TOP', meaning: 'topic', category: 'information structure' },
	{ abbreviation: 'FOC', meaning: 'focus', category: 'information structure' },
	{ abbreviation: 'REL', meaning: 'relative', category: 'clause type' },
	{ abbreviation: 'COMP', meaning: 'complementizer', category: 'clause type' },
	{ abbreviation: 'NMLZ', meaning: 'nominalizer', category: 'derivation' },
	{ abbreviation: 'ADJ', meaning: 'adjectivizer', category: 'derivation' },
	{ abbreviation: 'AGT', meaning: 'agent', category: 'derivation' },
	{ abbreviation: 'PAT', meaning: 'patient', category: 'derivation' },
	{ abbreviation: 'DIM', meaning: 'diminutive', category: 'derivation' },
	{ abbreviation: 'AUG', meaning: 'augmentative', category: 'derivation' },
	{ abbreviation: 'CLF', meaning: 'classifier', category: 'other' },
	{ abbreviation: 'COP', meaning: 'copula', category: 'other' },
	{ abbreviation: 'EXIST', meaning: 'existential', category: 'other' },
	{ abbreviation: 'POSS', meaning: 'possessive', category: 'other' },
	{ abbreviation: 'PROX', meaning: 'proximal', category: 'deixis' },
	{ abbreviation: 'DIST', meaning: 'distal', category: 'deixis' },
	{ abbreviation: 'MED', meaning: 'medial', category: 'deixis' },
	{ abbreviation: 'VIS', meaning: 'visible', category: 'evidentiality' },
	{ abbreviation: 'NVIS', meaning: 'non-visible', category: 'evidentiality' },
	{ abbreviation: 'DIR', meaning: 'direct evidence', category: 'evidentiality' },
	{ abbreviation: 'INFER', meaning: 'inferential', category: 'evidentiality' },
	{ abbreviation: 'REP', meaning: 'reportative', category: 'evidentiality' },
	{ abbreviation: 'QUOT', meaning: 'quotative', category: 'evidentiality' }
];

export class InterlinearEngine {
	private abbreviations: Map<string, GlossAbbreviation> = new Map();
	private customAbbreviations: Map<string, GlossAbbreviation> = new Map();
	
	constructor() {
		this.initializeAbbreviations();
	}
	
	private initializeAbbreviations() {
		for (const abbr of STANDARD_GLOSS_ABBREVIATIONS) {
			this.abbreviations.set(abbr.abbreviation, abbr);
		}
	}
	
	addCustomAbbreviation(abbr: GlossAbbreviation) {
		this.customAbbreviations.set(abbr.abbreviation, abbr);
	}
	
	getAbbreviationMeaning(abbr: string): string | undefined {
		return this.customAbbreviations.get(abbr)?.meaning ?? 
			this.abbreviations.get(abbr)?.meaning;
	}
	
	parseInterlinear(text: string): InterlinearWord[] {
		const words = text.trim().split(/\s+/);
		return words.map(word => this.parseWord(word));
	}
	
	private parseWord(word: string): InterlinearWord {
		const morphemes = word.split('-').map(m => {
			const parts = m.split(':');
			if (parts.length === 2) {
				return {
					surface: parts[0],
					gloss: parts[1]
				};
			}
			return {
				surface: m,
				gloss: m.toUpperCase()
			};
		});
		
		return {
			original: word,
			morphemes
		};
	}
	
	formatInterlinear(line: InterlinearLine, format: 'plain' | 'html' | 'latex' = 'plain'): string {
		switch (format) {
			case 'html':
				return this.formatHtml(line);
			case 'latex':
				return this.formatLatex(line);
			default:
				return this.formatPlain(line);
		}
	}
	
	private formatPlain(line: InterlinearLine): string {
		const originalLine = line.words.map(w => w.original).join(' ');
		const morphemeLine = line.words.map(w => 
			w.morphemes.map(m => m.surface).join('-')
		).join(' ');
		const glossLine = line.words.map(w => 
			w.morphemes.map(m => m.gloss).join('-')
		).join(' ');
		
		return [
			originalLine,
			morphemeLine,
			glossLine,
			`'${line.freeTranslation}'`
		].join('\n');
	}
	
	private formatHtml(line: InterlinearLine): string {
		const wordDivs = line.words.map(word => {
			const morphemeSpans = word.morphemes.map(m => 
				`<span class="morpheme">
					<span class="surface">${m.surface}</span>
					<span class="gloss">${m.gloss}</span>
				</span>`
			).join('');
			
			return `<div class="word">${morphemeSpans}</div>`;
		}).join('\n');
		
		return `<div class="interlinear">
			<div class="words">${wordDivs}</div>
			<div class="translation">'${line.freeTranslation}'</div>
		</div>`;
	}
	
	private formatLatex(line: InterlinearLine): string {
		const glosses = line.words.map(w => {
			const morphemes = w.morphemes.map(m => m.surface).join('-');
			const glossStr = w.morphemes.map(m => m.gloss).join('-');
			return `${morphemes} & ${glossStr}`;
		});
		
		return `\\ex
\\gll ${line.words.map(w => w.morphemes.map(m => m.surface).join('-')).join(' ')}\\\\
     ${line.words.map(w => w.morphemes.map(m => m.gloss).join('-')).join(' ')}\\\\
\\trans '${line.freeTranslation}'`;
	}
	
	alignMorphemes(words: InterlinearWord[]): string[][] {
		const rows: string[][] = [[], [], []];
		
		for (const word of words) {
			const surface = word.morphemes.map(m => m.surface).join('-');
			const underlying = word.morphemes.map(m => m.underlying || m.surface).join('-');
			const gloss = word.morphemes.map(m => m.gloss).join('-');
			
			const maxLen = Math.max(surface.length, underlying.length, gloss.length);
			
			rows[0].push(surface.padEnd(maxLen));
			rows[1].push(underlying.padEnd(maxLen));
			rows[2].push(gloss.padEnd(maxLen));
		}
		
		return rows;
	}
	
	validateGloss(gloss: string): { valid: boolean; unknownAbbreviations: string[] } {
		const parts = gloss.split(/[-.:]/);
		const unknownAbbreviations: string[] = [];
		
		for (const part of parts) {
			const upper = part.toUpperCase();
			if (upper === part && part.length > 0) {
				if (!this.abbreviations.has(part) && !this.customAbbreviations.has(part)) {
					if (!/^\d+$/.test(part)) {
						unknownAbbreviations.push(part);
					}
				}
			}
		}
		
		return {
			valid: unknownAbbreviations.length === 0,
			unknownAbbreviations
		};
	}
	
	suggestGloss(meaning: string): string[] {
		const suggestions: string[] = [];
		const lowerMeaning = meaning.toLowerCase();
		
		for (const [abbr, data] of this.abbreviations) {
			if (data.meaning.toLowerCase().includes(lowerMeaning)) {
				suggestions.push(abbr);
			}
		}
		
		for (const [abbr, data] of this.customAbbreviations) {
			if (data.meaning.toLowerCase().includes(lowerMeaning)) {
				suggestions.push(abbr);
			}
		}
		
		return suggestions;
	}
	
	getAbbreviationsByCategory(category: string): GlossAbbreviation[] {
		const result: GlossAbbreviation[] = [];
		
		for (const abbr of this.abbreviations.values()) {
			if (abbr.category === category) {
				result.push(abbr);
			}
		}
		
		for (const abbr of this.customAbbreviations.values()) {
			if (abbr.category === category) {
				result.push(abbr);
			}
		}
		
		return result;
	}
	
	getAllCategories(): string[] {
		const categories = new Set<string>();
		
		for (const abbr of this.abbreviations.values()) {
			if (abbr.category) categories.add(abbr.category);
		}
		
		for (const abbr of this.customAbbreviations.values()) {
			if (abbr.category) categories.add(abbr.category);
		}
		
		return Array.from(categories).sort();
	}
}

export const interlinearEngine = new InterlinearEngine();
