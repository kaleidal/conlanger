export interface Morpheme {
	id?: string;
	form: string;
	gloss: string;
	type: 'prefix' | 'suffix' | 'infix' | 'circumfix' | 'interfix' | 'suprafix' | 'transfix';
	allomorphs?: Allomorph[];
	grammaticalMeaning?: Record<string, string>;
	phonologicalCondition?: string;
	description?: string;
}

export interface Allomorph {
	form: string;
	condition: string;
	description?: string;
}

export interface ParadigmCell {
	features: Record<string, string>;
	form: string;
	isRegular: boolean;
}

export interface InflectionClass {
	id?: string;
	name: string;
	wordClass: string;
	description?: string;
	paradigm: ParadigmCell[];
}

export interface GrammarCategory {
	id?: string;
	name: string;
	abbreviation?: string;
	description?: string;
	values: { name: string; abbreviation: string; description?: string }[];
	appliesTo?: string[];
}

export interface MorphologicalAnalysis {
	stem: string;
	affixes: { morpheme: Morpheme; position: number }[];
	features: Record<string, string>;
	gloss: string;
}

export class MorphologyEngine {
	private morphemes: Morpheme[] = [];
	private inflectionClasses: Map<string, InflectionClass> = new Map();
	private grammarCategories: Map<string, GrammarCategory> = new Map();
	
	constructor(morphemes: Morpheme[] = [], classes: InflectionClass[] = [], categories: GrammarCategory[] = []) {
		this.setMorphemes(morphemes);
		this.setInflectionClasses(classes);
		this.setGrammarCategories(categories);
	}
	
	setMorphemes(morphemes: Morpheme[]) {
		this.morphemes = morphemes;
	}
	
	setInflectionClasses(classes: InflectionClass[]) {
		this.inflectionClasses.clear();
		for (const cls of classes) {
			if (cls.id) this.inflectionClasses.set(cls.id, cls);
		}
	}
	
	setGrammarCategories(categories: GrammarCategory[]) {
		this.grammarCategories.clear();
		for (const cat of categories) {
			if (cat.id) this.grammarCategories.set(cat.id, cat);
		}
	}
	
	applyAffix(stem: string, morpheme: Morpheme, context?: Record<string, string>): string {
		const form = this.selectAllomorph(morpheme, stem, context);
		
		switch (morpheme.type) {
			case 'prefix':
				return form + stem;
			case 'suffix':
				return stem + form;
			case 'infix':
				const infixPos = this.findInfixPosition(stem);
				return stem.slice(0, infixPos) + form + stem.slice(infixPos);
			case 'circumfix':
				const parts = form.split('-');
				return (parts[0] || '') + stem + (parts[1] || '');
			case 'interfix':
				return stem + form;
			default:
				return stem + form;
		}
	}
	
	private selectAllomorph(morpheme: Morpheme, stem: string, context?: Record<string, string>): string {
		if (!morpheme.allomorphs || morpheme.allomorphs.length === 0) {
			return morpheme.form;
		}
		
		for (const allomorph of morpheme.allomorphs) {
			if (this.matchesCondition(allomorph.condition, stem, context)) {
				return allomorph.form;
			}
		}
		
		return morpheme.form;
	}
	
	private matchesCondition(condition: string, stem: string, context?: Record<string, string>): boolean {
		if (condition.startsWith('after:')) {
			const pattern = condition.slice(6);
			return new RegExp(pattern + '$').test(stem);
		}
		
		if (condition.startsWith('before:')) {
			const pattern = condition.slice(7);
			return new RegExp('^' + pattern).test(stem);
		}
		
		if (condition.includes('=') && context) {
			const [key, value] = condition.split('=');
			return context[key.trim()] === value.trim();
		}
		
		return new RegExp(condition).test(stem);
	}
	
	private findInfixPosition(stem: string): number {
		const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ']);
		
		for (let i = 0; i < stem.length; i++) {
			if (vowels.has(stem[i])) {
				return i + 1;
			}
		}
		
		return Math.floor(stem.length / 2);
	}
	
	inflect(stem: string, classId: string, features: Record<string, string>): string | null {
		const inflectionClass = this.inflectionClasses.get(classId);
		if (!inflectionClass) return null;
		
		const matchingCell = inflectionClass.paradigm.find(cell => {
			return Object.entries(features).every(([key, value]) => cell.features[key] === value);
		});
		
		if (matchingCell) {
			return this.applyParadigmForm(stem, matchingCell.form);
		}
		
		return this.buildInflectedForm(stem, features);
	}
	
	private applyParadigmForm(stem: string, formPattern: string): string {
		if (!formPattern.includes('{')) {
			return formPattern;
		}
		
		return formPattern.replace(/\{stem\}/g, stem);
	}
	
	private buildInflectedForm(stem: string, features: Record<string, string>): string {
		let result = stem;
		
		const prefixes = this.morphemes.filter(m => 
			m.type === 'prefix' && 
			this.morphemeMatchesFeatures(m, features)
		);
		
		const suffixes = this.morphemes.filter(m => 
			m.type === 'suffix' && 
			this.morphemeMatchesFeatures(m, features)
		);
		
		for (const prefix of prefixes) {
			result = this.applyAffix(result, prefix, features);
		}
		
		for (const suffix of suffixes) {
			result = this.applyAffix(result, suffix, features);
		}
		
		return result;
	}
	
	private morphemeMatchesFeatures(morpheme: Morpheme, features: Record<string, string>): boolean {
		if (!morpheme.grammaticalMeaning) return false;
		
		return Object.entries(morpheme.grammaticalMeaning).some(([key, value]) => 
			features[key] === value
		);
	}
	
	analyze(word: string): MorphologicalAnalysis[] {
		const analyses: MorphologicalAnalysis[] = [];
		
		for (const morpheme of this.morphemes) {
			if (morpheme.type === 'prefix' && word.startsWith(morpheme.form)) {
				const remainder = word.slice(morpheme.form.length);
				const subAnalyses = this.analyze(remainder);
				
				for (const sub of subAnalyses) {
					analyses.push({
						stem: sub.stem,
						affixes: [{ morpheme, position: 0 }, ...sub.affixes],
						features: { ...morpheme.grammaticalMeaning, ...sub.features },
						gloss: `${morpheme.gloss}-${sub.gloss}`
					});
				}
			}
			
			if (morpheme.type === 'suffix' && word.endsWith(morpheme.form)) {
				const remainder = word.slice(0, -morpheme.form.length);
				const subAnalyses = this.analyze(remainder);
				
				for (const sub of subAnalyses) {
					analyses.push({
						stem: sub.stem,
						affixes: [...sub.affixes, { morpheme, position: sub.stem.length }],
						features: { ...sub.features, ...morpheme.grammaticalMeaning },
						gloss: `${sub.gloss}-${morpheme.gloss}`
					});
				}
			}
		}
		
		if (analyses.length === 0) {
			analyses.push({
				stem: word,
				affixes: [],
				features: {},
				gloss: word
			});
		}
		
		return analyses;
	}
	
	generateParadigm(stem: string, classId: string): Map<string, string> {
		const paradigm = new Map<string, string>();
		const inflectionClass = this.inflectionClasses.get(classId);
		
		if (!inflectionClass) return paradigm;
		
		for (const cell of inflectionClass.paradigm) {
			const featureKey = Object.entries(cell.features)
				.map(([k, v]) => `${k}:${v}`)
				.sort()
				.join(',');
			
			paradigm.set(featureKey, this.applyParadigmForm(stem, cell.form));
		}
		
		return paradigm;
	}
	
	formatGloss(analysis: MorphologicalAnalysis): string {
		const parts: string[] = [];
		
		for (const affix of analysis.affixes.filter(a => a.morpheme.type === 'prefix')) {
			parts.push(affix.morpheme.gloss);
		}
		
		parts.push(analysis.stem.toUpperCase());
		
		for (const affix of analysis.affixes.filter(a => a.morpheme.type === 'suffix')) {
			parts.push(affix.morpheme.gloss);
		}
		
		return parts.join('-');
	}
	
	getGrammarCategoryCombinations(wordClass: string): Record<string, string>[] {
		const relevantCategories = Array.from(this.grammarCategories.values())
			.filter(cat => !cat.appliesTo || cat.appliesTo.includes(wordClass));
		
		if (relevantCategories.length === 0) return [{}];
		
		const combinations: Record<string, string>[] = [{}];
		
		for (const category of relevantCategories) {
			const newCombinations: Record<string, string>[] = [];
			
			for (const combo of combinations) {
				for (const value of category.values) {
					newCombinations.push({
						...combo,
						[category.name]: value.name
					});
				}
			}
			
			combinations.length = 0;
			combinations.push(...newCombinations);
		}
		
		return combinations;
	}
}
