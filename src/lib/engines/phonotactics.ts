export interface PhonotacticRule {
	id?: string;
	name: string;
	pattern: string;
	description?: string;
	syllablePosition?: string;
	isRequired?: boolean;
	examples?: string[];
}

export interface SyllableStructure {
	onset: string[];
	nucleus: string[];
	coda: string[];
}

export interface PhonotacticValidation {
	valid: boolean;
	errors: string[];
	syllabification?: string[];
}

export class PhonotacticsEngine {
	private consonants: Set<string> = new Set();
	private vowels: Set<string> = new Set();
	private onsetPatterns: RegExp[] = [];
	private codaPatterns: RegExp[] = [];
	private nucleusPatterns: RegExp[] = [];
	
	constructor(phonemes: { symbol: string; type: 'consonant' | 'vowel' }[] = []) {
		this.setPhonemes(phonemes);
	}
	
	setPhonemes(phonemes: { symbol: string; type: 'consonant' | 'vowel' }[]) {
		this.consonants.clear();
		this.vowels.clear();
		
		for (const phoneme of phonemes) {
			if (phoneme.type === 'consonant') {
				this.consonants.add(phoneme.symbol);
			} else {
				this.vowels.add(phoneme.symbol);
			}
		}
	}
	
	setPatterns(rules: PhonotacticRule[]) {
		this.onsetPatterns = [];
		this.codaPatterns = [];
		this.nucleusPatterns = [];
		
		for (const rule of rules) {
			const regex = this.patternToRegex(rule.pattern);
			
			switch (rule.syllablePosition) {
				case 'onset':
					this.onsetPatterns.push(regex);
					break;
				case 'coda':
					this.codaPatterns.push(regex);
					break;
				case 'nucleus':
					this.nucleusPatterns.push(regex);
					break;
			}
		}
	}
	
	private patternToRegex(pattern: string): RegExp {
		let regexStr = pattern;
		
		const consonantList = Array.from(this.consonants).map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
		const vowelList = Array.from(this.vowels).map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
		
		regexStr = regexStr.replace(/C/g, `(?:${consonantList || '.'})`);
		regexStr = regexStr.replace(/V/g, `(?:${vowelList || '.'})`);
		
		regexStr = regexStr.replace(/\(([^)]+)\)/g, '(?:$1)?');
		
		return new RegExp(`^${regexStr}$`);
	}
	
	syllabify(word: string): string[] {
		const segments = this.segmentWord(word);
		const syllables: string[] = [];
		let current = '';
		let hasNucleus = false;
		
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const isVowel = this.vowels.has(segment);
			
			if (isVowel) {
				current += segment;
				hasNucleus = true;
			} else {
				if (hasNucleus) {
					const nextVowelIndex = segments.slice(i).findIndex(s => this.vowels.has(s));
					
					if (nextVowelIndex === -1) {
						current += segment;
					} else if (nextVowelIndex === 1) {
						syllables.push(current);
						current = segment;
						hasNucleus = false;
					} else {
						const consonantCluster = segments.slice(i, i + nextVowelIndex);
						const splitPoint = this.findSyllableBoundary(consonantCluster);
						
						for (let j = 0; j < splitPoint; j++) {
							current += segments[i + j];
						}
						syllables.push(current);
						
						current = '';
						for (let j = splitPoint; j < consonantCluster.length; j++) {
							current += segments[i + j];
						}
						i += nextVowelIndex - 1;
						hasNucleus = false;
					}
				} else {
					current += segment;
				}
			}
		}
		
		if (current) {
			syllables.push(current);
		}
		
		return syllables;
	}
	
	private segmentWord(word: string): string[] {
		const segments: string[] = [];
		let i = 0;
		
		const allPhonemes = [...this.consonants, ...this.vowels].sort((a, b) => b.length - a.length);
		
		while (i < word.length) {
			let found = false;
			
			for (const phoneme of allPhonemes) {
				if (word.substring(i, i + phoneme.length) === phoneme) {
					segments.push(phoneme);
					i += phoneme.length;
					found = true;
					break;
				}
			}
			
			if (!found) {
				segments.push(word[i]);
				i++;
			}
		}
		
		return segments;
	}
	
	private findSyllableBoundary(cluster: string[]): number {
		if (cluster.length <= 1) return cluster.length;
		
		for (let i = 1; i < cluster.length; i++) {
			const coda = cluster.slice(0, i).join('');
			const onset = cluster.slice(i).join('');
			
			const codaValid = this.codaPatterns.length === 0 || this.codaPatterns.some(p => p.test(coda));
			const onsetValid = this.onsetPatterns.length === 0 || this.onsetPatterns.some(p => p.test(onset));
			
			if (codaValid && onsetValid) {
				return i;
			}
		}
		
		return 1;
	}
	
	validateWord(word: string): PhonotacticValidation {
		const syllables = this.syllabify(word);
		const errors: string[] = [];
		
		for (let i = 0; i < syllables.length; i++) {
			const syllable = syllables[i];
			const structure = this.parseSyllable(syllable);
			
			if (structure.onset && this.onsetPatterns.length > 0) {
				const onsetValid = this.onsetPatterns.some(p => p.test(structure.onset.join('')));
				if (!onsetValid) {
					errors.push(`Invalid onset "${structure.onset.join('')}" in syllable ${i + 1}`);
				}
			}
			
			if (structure.coda && this.codaPatterns.length > 0) {
				const codaValid = this.codaPatterns.some(p => p.test(structure.coda.join('')));
				if (!codaValid) {
					errors.push(`Invalid coda "${structure.coda.join('')}" in syllable ${i + 1}`);
				}
			}
		}
		
		return {
			valid: errors.length === 0,
			errors,
			syllabification: syllables
		};
	}
	
	private parseSyllable(syllable: string): SyllableStructure {
		const segments = this.segmentWord(syllable);
		const onset: string[] = [];
		const nucleus: string[] = [];
		const coda: string[] = [];
		
		let phase: 'onset' | 'nucleus' | 'coda' = 'onset';
		
		for (const segment of segments) {
			const isVowel = this.vowels.has(segment);
			
			if (phase === 'onset') {
				if (isVowel) {
					nucleus.push(segment);
					phase = 'nucleus';
				} else {
					onset.push(segment);
				}
			} else if (phase === 'nucleus') {
				if (isVowel) {
					nucleus.push(segment);
				} else {
					coda.push(segment);
					phase = 'coda';
				}
			} else {
				coda.push(segment);
			}
		}
		
		return { onset, nucleus, coda };
	}
	
	generateSyllable(structure: string = 'CV'): string {
		let result = '';
		
		for (const char of structure) {
			if (char === 'C' && this.consonants.size > 0) {
				const consonantArray = Array.from(this.consonants);
				result += consonantArray[Math.floor(Math.random() * consonantArray.length)];
			} else if (char === 'V' && this.vowels.size > 0) {
				const vowelArray = Array.from(this.vowels);
				result += vowelArray[Math.floor(Math.random() * vowelArray.length)];
			}
		}
		
		return result;
	}
	
	generateWord(syllableCount: number, structures: string[] = ['CV', 'CVC']): string {
		let word = '';
		
		for (let i = 0; i < syllableCount; i++) {
			const structure = structures[Math.floor(Math.random() * structures.length)];
			word += this.generateSyllable(structure);
		}
		
		return word;
	}
}
