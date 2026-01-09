export interface ExportData {
	version: string;
	exportedAt: string;
	language: LanguageExport;
}

export interface LanguageExport {
	name: string;
	nativeName?: string;
	description?: string;
	settings?: Record<string, unknown>;
	phonology: {
		phonemes: PhonemeExport[];
		allophones: AllophoneExport[];
		phonotactics: PhonotacticExport[];
		soundChanges: SoundChangeExport[];
	};
	morphology: {
		morphemes: MorphemeExport[];
		grammarCategories: GrammarCategoryExport[];
		inflectionClasses: InflectionClassExport[];
	};
	syntax: {
		rules: SyntaxRuleExport[];
		settings?: Record<string, unknown>;
	};
	lexicon: {
		words: WordExport[];
	};
	scripts: ScriptExport[];
	texts: TextExport[];
}

export interface PhonemeExport {
	symbol: string;
	type: 'consonant' | 'vowel';
	ipa: string;
	romanization?: string;
	features?: Record<string, unknown>;
	description?: string;
}

export interface AllophoneExport {
	phonemeSymbol: string;
	symbol: string;
	ipa: string;
	environment: string;
	environmentDescription?: string;
}

export interface PhonotacticExport {
	name: string;
	pattern: string;
	description?: string;
	syllablePosition?: string;
	examples?: string[];
}

export interface SoundChangeExport {
	name: string;
	fromPattern: string;
	toPattern: string;
	environment?: string;
	description?: string;
	orderIndex: number;
	era?: string;
}

export interface MorphemeExport {
	form: string;
	gloss: string;
	type: string;
	allomorphs?: { form: string; condition: string }[];
	grammaticalMeaning?: Record<string, string>;
	description?: string;
}

export interface GrammarCategoryExport {
	name: string;
	abbreviation?: string;
	values: { name: string; abbreviation: string }[];
	appliesTo?: string[];
}

export interface InflectionClassExport {
	name: string;
	wordClass: string;
	paradigm: { features: Record<string, string>; form: string }[];
}

export interface SyntaxRuleExport {
	name: string;
	ruleType: string;
	pattern: string;
	output?: string;
	description?: string;
	examples?: { input: string; output: string; gloss?: string; translation?: string }[];
}

export interface WordExport {
	lemma: string;
	ipa?: string;
	romanization?: string;
	wordClass: string;
	inflectionClass?: string;
	definitions: { meaning: string; examples?: string[] }[];
	etymology?: {
		origin?: string;
		protoForm?: string;
		borrowedFrom?: string;
	};
	morphologicalAnalysis?: string;
	tags?: string[];
	semanticFields?: string[];
}

export interface ScriptExport {
	name: string;
	type: string;
	direction: string;
	glyphs: {
		character?: string;
		svgPath?: string;
		phonemeMapping?: string;
		name?: string;
	}[];
	romanizationRules: {
		nativeForm: string;
		romanizedForm: string;
		environment?: string;
	}[];
}

export interface TextExport {
	title: string;
	originalText?: string;
	translatedText?: string;
	interlinearData?: unknown[];
	notes?: string;
	source?: string;
}

export class ExportEngine {
	static readonly VERSION = '1.0.0';
	
	static exportToJson(data: LanguageExport): string {
		const exportData: ExportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			language: data
		};
		
		return JSON.stringify(exportData, null, 2);
	}
	
	static importFromJson(json: string): { success: boolean; data?: LanguageExport; errors?: string[] } {
		try {
			const parsed = JSON.parse(json) as ExportData;
			
			if (!parsed.version) {
				return { success: false, errors: ['Invalid export file: missing version'] };
			}
			
			if (!parsed.language) {
				return { success: false, errors: ['Invalid export file: missing language data'] };
			}
			
			const errors = this.validateImport(parsed.language);
			if (errors.length > 0) {
				return { success: false, errors };
			}
			
			return { success: true, data: parsed.language };
		} catch (e) {
			return { success: false, errors: [`Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`] };
		}
	}
	
	private static validateImport(data: LanguageExport): string[] {
		const errors: string[] = [];
		
		if (!data.name) {
			errors.push('Language name is required');
		}
		
		return errors;
	}
	
	static exportToLatex(data: LanguageExport): string {
		let latex = `\\documentclass{article}
\\usepackage{tipa}
\\usepackage{booktabs}
\\usepackage{longtable}

\\title{${data.name}${data.nativeName ? ` (${data.nativeName})` : ''}}
\\date{\\today}

\\begin{document}
\\maketitle

`;

		if (data.description) {
			latex += `\\section{Introduction}\n${data.description}\n\n`;
		}

		latex += `\\section{Phonology}\n\n`;
		latex += `\\subsection{Phoneme Inventory}\n\n`;
		
		const consonants = data.phonology.phonemes.filter(p => p.type === 'consonant');
		const vowels = data.phonology.phonemes.filter(p => p.type === 'vowel');
		
		if (consonants.length > 0) {
			latex += `\\subsubsection{Consonants}\n`;
			latex += consonants.map(p => `/${p.ipa}/`).join(', ') + '\n\n';
		}
		
		if (vowels.length > 0) {
			latex += `\\subsubsection{Vowels}\n`;
			latex += vowels.map(p => `/${p.ipa}/`).join(', ') + '\n\n';
		}

		if (data.phonology.soundChanges.length > 0) {
			latex += `\\subsection{Sound Changes}\n\n`;
			latex += `\\begin{enumerate}\n`;
			for (const sc of data.phonology.soundChanges) {
				latex += `\\item ${sc.fromPattern} $\\rightarrow$ ${sc.toPattern}${sc.environment ? ` / ${sc.environment}` : ''}\n`;
			}
			latex += `\\end{enumerate}\n\n`;
		}

		if (data.lexicon.words.length > 0) {
			latex += `\\section{Lexicon}\n\n`;
			latex += `\\begin{longtable}{lllp{6cm}}\n`;
			latex += `\\toprule\n`;
			latex += `Lemma & IPA & Class & Definition \\\\\n`;
			latex += `\\midrule\n`;
			latex += `\\endhead\n`;
			
			for (const word of data.lexicon.words.slice(0, 100)) {
				const def = word.definitions[0]?.meaning ?? '';
				latex += `${word.lemma} & ${word.ipa ?? ''} & ${word.wordClass} & ${def} \\\\\n`;
			}
			
			latex += `\\bottomrule\n`;
			latex += `\\end{longtable}\n\n`;
		}

		latex += `\\end{document}`;
		
		return latex;
	}
	
	static exportToMarkdown(data: LanguageExport): string {
		let md = `# ${data.name}`;
		if (data.nativeName) {
			md += ` (${data.nativeName})`;
		}
		md += '\n\n';
		
		if (data.description) {
			md += `${data.description}\n\n`;
		}
		
		md += `## Phonology\n\n`;
		md += `### Phoneme Inventory\n\n`;
		
		const consonants = data.phonology.phonemes.filter(p => p.type === 'consonant');
		const vowels = data.phonology.phonemes.filter(p => p.type === 'vowel');
		
		if (consonants.length > 0) {
			md += `**Consonants:** ${consonants.map(p => `/${p.ipa}/`).join(' ')}\n\n`;
		}
		
		if (vowels.length > 0) {
			md += `**Vowels:** ${vowels.map(p => `/${p.ipa}/`).join(' ')}\n\n`;
		}
		
		if (data.phonology.soundChanges.length > 0) {
			md += `### Sound Changes\n\n`;
			for (const sc of data.phonology.soundChanges) {
				md += `- ${sc.fromPattern} > ${sc.toPattern}${sc.environment ? ` / ${sc.environment}` : ''}\n`;
			}
			md += '\n';
		}
		
		if (data.morphology.grammarCategories.length > 0) {
			md += `## Grammar\n\n`;
			md += `### Grammatical Categories\n\n`;
			for (const cat of data.morphology.grammarCategories) {
				md += `**${cat.name}:** ${cat.values.map(v => v.name).join(', ')}\n\n`;
			}
		}
		
		if (data.lexicon.words.length > 0) {
			md += `## Lexicon\n\n`;
			md += `| Lemma | IPA | Class | Definition |\n`;
			md += `|-------|-----|-------|------------|\n`;
			
			for (const word of data.lexicon.words.slice(0, 50)) {
				const def = word.definitions[0]?.meaning ?? '';
				md += `| ${word.lemma} | ${word.ipa ?? '-'} | ${word.wordClass} | ${def} |\n`;
			}
			md += '\n';
		}
		
		return md;
	}
	
	static exportLexiconToCsv(words: WordExport[]): string {
		const headers = ['lemma', 'ipa', 'romanization', 'wordClass', 'definition', 'tags', 'semanticFields'];
		const rows = [headers.join(',')];
		
		for (const word of words) {
			const row = [
				`"${word.lemma}"`,
				`"${word.ipa ?? ''}"`,
				`"${word.romanization ?? ''}"`,
				`"${word.wordClass}"`,
				`"${word.definitions.map(d => d.meaning).join('; ')}"`,
				`"${(word.tags ?? []).join('; ')}"`,
				`"${(word.semanticFields ?? []).join('; ')}"`
			];
			rows.push(row.join(','));
		}
		
		return rows.join('\n');
	}
	
	static importLexiconFromCsv(csv: string): WordExport[] {
		const lines = csv.split('\n').filter(l => l.trim());
		if (lines.length < 2) return [];
		
		const headers = this.parseCsvLine(lines[0]);
		const words: WordExport[] = [];
		
		for (let i = 1; i < lines.length; i++) {
			const values = this.parseCsvLine(lines[i]);
			const word: Partial<WordExport> = {};
			
			for (let j = 0; j < headers.length; j++) {
				const header = headers[j].toLowerCase();
				const value = values[j] ?? '';
				
				switch (header) {
					case 'lemma':
						word.lemma = value;
						break;
					case 'ipa':
						word.ipa = value;
						break;
					case 'romanization':
						word.romanization = value;
						break;
					case 'wordclass':
					case 'class':
					case 'pos':
						word.wordClass = value;
						break;
					case 'definition':
					case 'meaning':
						word.definitions = [{ meaning: value }];
						break;
					case 'tags':
						word.tags = value.split(';').map(t => t.trim()).filter(Boolean);
						break;
					case 'semanticfields':
					case 'semantic_fields':
						word.semanticFields = value.split(';').map(t => t.trim()).filter(Boolean);
						break;
				}
			}
			
			if (word.lemma && word.wordClass) {
				words.push(word as WordExport);
			}
		}
		
		return words;
	}
	
	private static parseCsvLine(line: string): string[] {
		const values: string[] = [];
		let current = '';
		let inQuotes = false;
		
		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				values.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		
		values.push(current.trim());
		return values;
	}
}
