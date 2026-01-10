import { parseIPAString, isVowel, isConsonant } from './ipa';

export interface SoundChange {
	id?: string;
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

export interface SoundChangeResult {
	original: string;
	result: string;
	changesApplied: { rule: SoundChange; before: string; after: string }[];
	skippedDueToException?: boolean;
}

export class SoundChangeEngine {
	private featureClasses: Map<string, Set<string>> = new Map();
	
	constructor() {
		this.initializeFeatureClasses();
	}
	
	private initializeFeatureClasses() {
		this.featureClasses.set('C', new Set(['p', 'b', 't', 'd', 'k', 'g', 'q', 'ʔ', 'm', 'n', 'ŋ', 'ɲ', 'ɴ', 'r', 'ɾ', 'ʀ', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'x', 'ɣ', 'χ', 'ʁ', 'h', 'ɦ', 'θ', 'ð', 'ç', 'ʝ', 'ɸ', 'β', 'ħ', 'ʕ', 'l', 'ʎ', 'ʟ', 'ɬ', 'ɮ', 'j', 'w', 'ɥ', 'ɰ', 'ʋ', 'ɹ', 'ɻ', 'c', 'ɟ', 'ʈ', 'ɖ', 'ɳ', 'ɭ', 'ʂ', 'ʐ', 'ɕ', 'ʑ']));
		this.featureClasses.set('V', new Set(['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɒ', 'æ', 'ɛ', 'ɪ', 'ɔ', 'ʊ', 'ʌ', 'ə', 'ɨ', 'ʉ', 'ɯ', 'y', 'ø', 'œ', 'ɵ', 'ɤ', 'ɘ', 'ɜ', 'ɞ', 'ɐ', 'ä', 'ɶ', 'ʏ']));
		this.featureClasses.set('N', new Set(['m', 'n', 'ŋ', 'ɲ', 'ɴ', 'ɱ', 'ɳ']));
		this.featureClasses.set('P', new Set(['p', 'b', 't', 'd', 'k', 'g', 'q', 'ʔ', 'c', 'ɟ', 'ʈ', 'ɖ', 'ɢ', 'ʡ']));
		this.featureClasses.set('F', new Set(['f', 'v', 's', 'z', 'ʃ', 'ʒ', 'x', 'ɣ', 'χ', 'ʁ', 'h', 'ɦ', 'θ', 'ð', 'ç', 'ʝ', 'ɸ', 'β', 'ħ', 'ʕ', 'ɬ', 'ɮ', 'ʂ', 'ʐ', 'ɕ', 'ʑ', 'ʍ', 'ɧ']));
		this.featureClasses.set('L', new Set(['l', 'ʎ', 'ʟ', 'ɭ', 'ɺ']));
		this.featureClasses.set('R', new Set(['r', 'ɾ', 'ʀ', 'ɽ', 'ɻ', 'ɹ']));
		this.featureClasses.set('G', new Set(['j', 'w', 'ɥ', 'ɰ']));
		this.featureClasses.set('H', new Set(['i', 'y', 'ɨ', 'ʉ', 'ɯ', 'u', 'ɪ', 'ʏ', 'ʊ']));
		this.featureClasses.set('M', new Set(['e', 'ø', 'ɘ', 'ɵ', 'ɤ', 'o', 'ə']));
		this.featureClasses.set('O', new Set(['ɛ', 'œ', 'ɜ', 'ɞ', 'ʌ', 'ɔ', 'æ', 'ɐ', 'a', 'ɶ', 'ä', 'ɑ', 'ɒ']));
		this.featureClasses.set('T', new Set(['p', 't', 'k', 'q', 'c', 'ʈ', 'f', 's', 'ʃ', 'x', 'χ', 'h', 'θ', 'ç', 'ɸ', 'ħ', 'ɬ', 'ʂ', 'ɕ', 'ʍ', 'ʔ', 'ʡ', 'ʜ']));
		this.featureClasses.set('D', new Set(['b', 'd', 'g', 'ɢ', 'ɟ', 'ɖ', 'v', 'z', 'ʒ', 'ɣ', 'ʁ', 'ɦ', 'ð', 'ʝ', 'β', 'ʕ', 'ɮ', 'ʐ', 'ʑ', 'm', 'n', 'ŋ', 'ɲ', 'ɴ', 'ɱ', 'ɳ', 'r', 'ɾ', 'ʀ', 'ɽ', 'l', 'ʎ', 'ʟ', 'ɭ', 'j', 'w', 'ɥ', 'ɰ', 'ʋ', 'ɹ', 'ɻ', 'ɺ', 'ʙ', 'ʢ']));
		this.featureClasses.set('B', new Set(['p', 'b', 'm', 'ɸ', 'β', 'ʙ']));
		this.featureClasses.set('A', new Set(['t', 'd', 'n', 's', 'z', 'ɾ', 'r', 'l', 'ɬ', 'ɮ', 'ɹ', 'ɺ']));
		this.featureClasses.set('K', new Set(['k', 'g', 'ŋ', 'x', 'ɣ', 'ɰ', 'ʟ']));
		this.featureClasses.set('U', new Set(['q', 'ɢ', 'ɴ', 'χ', 'ʁ', 'ʀ']));
		this.featureClasses.set('I', new Set(['i', 'ɪ', 'e', 'ɛ', 'æ']));
		this.featureClasses.set('E', new Set(['u', 'ʊ', 'o', 'ɔ', 'ɑ', 'ɒ']));
		this.featureClasses.set('W', new Set(['#']));
	}
	
	addFeatureClass(name: string, sounds: string[]) {
		this.featureClasses.set(name, new Set(sounds));
	}
	
	private expandPattern(pattern: string): RegExp {
		if (!pattern || pattern.trim() === '') {
			return new RegExp('(?!)', 'g');
		}
		
		let expanded = pattern;
		
		expanded = expanded.replace(/\(([^)]+)\)/g, '(?:$1)?');
		expanded = expanded.replace(/\{([^}]+)\}/g, '[$1]');
		
		expanded = expanded.replace(/#/g, '(?:^|$|\\s)');
		
		for (const [className, sounds] of this.featureClasses) {
			const soundList = Array.from(sounds).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
			expanded = expanded.replace(new RegExp(className, 'g'), `(?:${soundList})`);
		}
		
		try {
			return new RegExp(expanded, 'g');
		} catch {
			console.warn('Invalid regex pattern:', pattern, 'expanded to:', expanded);
			return new RegExp('(?!)', 'g');
		}
	}
	
	private parseEnvironment(environment: string): { before: string; after: string } {
		const parts = environment.split('_');
		return {
			before: parts[0] || '',
			after: parts[1] || ''
		};
	}
	
	private matchesEnvironment(word: string, position: number, matchLength: number, environment: string): boolean {
		if (!environment || environment === '_') return true;
		
		const { before, after } = this.parseEnvironment(environment);
		
		const beforeContext = '#' + word.substring(0, position);
		const afterContext = word.substring(position + matchLength) + '#';
		
		if (before) {
			const beforeRegex = this.expandPattern(before + '$');
			if (!beforeRegex.test(beforeContext)) return false;
		}
		
		if (after) {
			const afterRegex = this.expandPattern('^' + after);
			if (!afterRegex.test(afterContext)) return false;
		}
		
		return true;
	}
	
	applyChange(word: string, change: SoundChange): { result: string; skipped: boolean } {
		if (change.isActive === false) return { result: word, skipped: false };
		
		if (change.exceptions && change.exceptions.length > 0) {
			const normalizedWord = word.toLowerCase();
			for (const exception of change.exceptions) {
				if (normalizedWord === exception.toLowerCase() || 
					normalizedWord.includes(exception.toLowerCase())) {
					return { result: word, skipped: true };
				}
			}
		}
		
		const fromPattern = this.expandPattern(change.fromPattern);
		let result = word;
		let offset = 0;
		
		const matches: { index: number; match: string }[] = [];
		let match;
		
		while ((match = fromPattern.exec(word)) !== null) {
			if (change.environment) {
				if (this.matchesEnvironment(word, match.index, match[0].length, change.environment)) {
					matches.push({ index: match.index, match: match[0] });
				}
			} else {
				matches.push({ index: match.index, match: match[0] });
			}
		}
		
		for (const m of matches) {
			const adjustedIndex = m.index + offset;
			const replacement = this.processReplacement(change.toPattern, m.match);
			result = result.substring(0, adjustedIndex) + replacement + result.substring(adjustedIndex + m.match.length);
			offset += replacement.length - m.match.length;
		}
		
		return { result, skipped: false };
	}
	
	private processReplacement(toPattern: string, matched: string): string {
		let result = toPattern;
		
		if (toPattern === '∅' || toPattern === '0' || toPattern === '') {
			return '';
		}
		
		result = result.replace(/\$(\d+)/g, (_, num) => {
			const index = parseInt(num);
			return matched[index - 1] || '';
		});
		
		return result;
	}
	
	applyChanges(word: string, changes: SoundChange[], wordExceptions?: string[]): SoundChangeResult {
		const sortedChanges = [...changes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
		const changesApplied: { rule: SoundChange; before: string; after: string }[] = [];
		
		let current = word;
		let skippedDueToException = false;
		
		if (wordExceptions && wordExceptions.length > 0) {
			const applicableChanges = sortedChanges.filter(c => !wordExceptions.includes(c.id ?? ''));
			for (const change of applicableChanges) {
				const before = current;
				const { result, skipped } = this.applyChange(current, change);
				current = result;
				
				if (skipped) {
					skippedDueToException = true;
				} else if (before !== current) {
					changesApplied.push({ rule: change, before, after: current });
				}
			}
		} else {
			for (const change of sortedChanges) {
				const before = current;
				const { result, skipped } = this.applyChange(current, change);
				current = result;
				
				if (skipped) {
					skippedDueToException = true;
				} else if (before !== current) {
					changesApplied.push({ rule: change, before, after: current });
				}
			}
		}
		
		return {
			original: word,
			result: current,
			changesApplied,
			skippedDueToException
		};
	}
	
	applyChangesToLexicon(words: string[], changes: SoundChange[]): Map<string, SoundChangeResult> {
		const results = new Map<string, SoundChangeResult>();
		
		for (const word of words) {
			results.set(word, this.applyChanges(word, changes));
		}
		
		return results;
	}
	
	validateRule(rule: SoundChange): { valid: boolean; errors: string[] } {
		const errors: string[] = [];
		
		if (!rule.fromPattern) {
			errors.push('Source pattern is required');
		}
		
		if (rule.toPattern === undefined) {
			errors.push('Target pattern is required');
		}
		
		if (rule.environment) {
			if (!rule.environment.includes('_')) {
				errors.push('Environment must contain underscore (_) to indicate position');
			}
		}
		
		try {
			this.expandPattern(rule.fromPattern);
		} catch {
			errors.push('Invalid source pattern');
		}
		
		return { valid: errors.length === 0, errors };
	}
	
	static formatRule(rule: SoundChange): string {
		let formatted = `${rule.fromPattern} → ${rule.toPattern || '∅'}`;
		if (rule.environment) {
			formatted += ` / ${rule.environment}`;
		}
		return formatted;
	}
}

export const soundChangeEngine = new SoundChangeEngine();
