export type ScriptType = 'alphabet' | 'abjad' | 'abugida' | 'syllabary' | 'logographic' | 'featural' | 'mixed';
export type WritingDirection = 'ltr' | 'rtl' | 'ttb' | 'btt';

export interface Glyph {
	id?: string;
	character?: string;
	svgPath?: string;
	unicodePoint?: string;
	phonemeMapping?: string;
	name?: string;
	variants?: GlyphVariant[];
	sortOrder?: number;
}

export interface GlyphVariant {
	position: string;
	form: string;
	svgPath?: string;
}

export interface RomanizationRule {
	id?: string;
	nativeForm: string;
	romanizedForm: string;
	environment?: string;
	priority?: number;
}

export interface Script {
	id?: string;
	name: string;
	type: ScriptType;
	description?: string;
	direction: WritingDirection;
	glyphs: Glyph[];
	romanizationRules: RomanizationRule[];
}

export class ScriptEngine {
	private glyphs: Map<string, Glyph> = new Map();
	private romanizationRules: RomanizationRule[] = [];
	private direction: WritingDirection = 'ltr';
	private type: ScriptType = 'alphabet';
	
	constructor(script?: Partial<Script>) {
		if (script) {
			this.loadScript(script);
		}
	}
	
	loadScript(script: Partial<Script>) {
		this.direction = script.direction ?? 'ltr';
		this.type = script.type ?? 'alphabet';
		
		this.glyphs.clear();
		if (script.glyphs) {
			for (const glyph of script.glyphs) {
				const key = glyph.phonemeMapping ?? glyph.character ?? glyph.id ?? '';
				this.glyphs.set(key, glyph);
			}
		}
		
		this.romanizationRules = [...(script.romanizationRules ?? [])];
		this.romanizationRules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
	}
	
	transliterate(text: string): string {
		let result = text;
		
		const sortedRules = [...this.romanizationRules].sort((a, b) => 
			(b.nativeForm.length - a.nativeForm.length) || ((b.priority ?? 0) - (a.priority ?? 0))
		);
		
		for (const rule of sortedRules) {
			if (rule.environment) {
				const regex = this.buildEnvironmentRegex(rule.nativeForm, rule.environment);
				result = result.replace(regex, rule.romanizedForm);
			} else {
				result = result.split(rule.nativeForm).join(rule.romanizedForm);
			}
		}
		
		return result;
	}
	
	private buildEnvironmentRegex(pattern: string, environment: string): RegExp {
		const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const [before, after] = environment.split('_');
		
		let regexStr = '';
		if (before && before !== '#') {
			regexStr += `(?<=${before})`;
		} else if (before === '#') {
			regexStr += '(?<=^|\\s)';
		}
		
		regexStr += `(${escapedPattern})`;
		
		if (after && after !== '#') {
			regexStr += `(?=${after})`;
		} else if (after === '#') {
			regexStr += '(?=$|\\s)';
		}
		
		return new RegExp(regexStr, 'g');
	}
	
	romanize(text: string): string {
		return this.transliterate(text);
	}
	
	deromanize(romanized: string): string {
		let result = romanized;
		
		const reverseRules = this.romanizationRules
			.map(r => ({ nativeForm: r.romanizedForm, romanizedForm: r.nativeForm, priority: r.priority }))
			.sort((a, b) => (b.nativeForm.length - a.nativeForm.length) || ((b.priority ?? 0) - (a.priority ?? 0)));
		
		for (const rule of reverseRules) {
			result = result.split(rule.nativeForm).join(rule.romanizedForm);
		}
		
		return result;
	}
	
	textToGlyphs(text: string): Glyph[] {
		const result: Glyph[] = [];
		const chars = [...text];
		
		let i = 0;
		while (i < chars.length) {
			let found = false;
			
			for (let len = Math.min(4, chars.length - i); len > 0; len--) {
				const substr = chars.slice(i, i + len).join('');
				const glyph = this.glyphs.get(substr);
				
				if (glyph) {
					result.push(glyph);
					i += len;
					found = true;
					break;
				}
			}
			
			if (!found) {
				result.push({
					character: chars[i],
					phonemeMapping: chars[i]
				});
				i++;
			}
		}
		
		return result;
	}
	
	glyphsToSvg(glyphs: Glyph[], options: { 
		fontSize?: number; 
		spacing?: number;
		color?: string;
	} = {}): string {
		const fontSize = options.fontSize ?? 24;
		const spacing = options.spacing ?? 4;
		const color = options.color ?? '#000';
		
		let x = 0;
		const elements: string[] = [];
		
		for (const glyph of glyphs) {
			if (glyph.svgPath) {
				elements.push(`<g transform="translate(${x}, 0)"><path d="${glyph.svgPath}" fill="${color}"/></g>`);
				x += fontSize + spacing;
			} else if (glyph.character) {
				elements.push(`<text x="${x}" y="${fontSize}" font-size="${fontSize}" fill="${color}">${glyph.character}</text>`);
				x += fontSize * 0.6 + spacing;
			}
		}
		
		const width = x;
		const height = fontSize * 1.5;
		
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${elements.join('')}</svg>`;
	}
	
	getGlyphVariant(glyph: Glyph, position: 'initial' | 'medial' | 'final' | 'isolated'): string {
		if (!glyph.variants) {
			return glyph.character ?? '';
		}
		
		const variant = glyph.variants.find(v => v.position === position);
		return variant?.form ?? glyph.character ?? '';
	}
	
	applyContextualForms(text: string): string {
		const glyphs = this.textToGlyphs(text);
		const result: string[] = [];
		
		for (let i = 0; i < glyphs.length; i++) {
			const glyph = glyphs[i];
			const isFirst = i === 0 || glyphs[i - 1].character === ' ';
			const isLast = i === glyphs.length - 1 || glyphs[i + 1]?.character === ' ';
			
			let position: 'initial' | 'medial' | 'final' | 'isolated';
			
			if (isFirst && isLast) {
				position = 'isolated';
			} else if (isFirst) {
				position = 'initial';
			} else if (isLast) {
				position = 'final';
			} else {
				position = 'medial';
			}
			
			result.push(this.getGlyphVariant(glyph, position));
		}
		
		return result.join('');
	}
	
	generateGlyphChart(): { headers: string[]; rows: { label: string; cells: (Glyph | null)[] }[] } {
		if (this.type === 'syllabary') {
			return this.generateSyllabaryChart();
		}
		
		return this.generateAlphabetChart();
	}
	
	private generateAlphabetChart(): { headers: string[]; rows: { label: string; cells: (Glyph | null)[] }[] } {
		const consonants: Glyph[] = [];
		const vowels: Glyph[] = [];
		
		for (const glyph of this.glyphs.values()) {
			const mapping = glyph.phonemeMapping ?? '';
			if (/[aeiouɑɛɪɔʊəæ]/.test(mapping)) {
				vowels.push(glyph);
			} else {
				consonants.push(glyph);
			}
		}
		
		return {
			headers: ['Consonants', 'Vowels'],
			rows: [
				{ label: 'Letters', cells: [...consonants, ...vowels] }
			]
		};
	}
	
	private generateSyllabaryChart(): { headers: string[]; rows: { label: string; cells: (Glyph | null)[] }[] } {
		const vowelOrder = ['a', 'e', 'i', 'o', 'u'];
		const consonantSet = new Set<string>();
		const syllableMap = new Map<string, Glyph>();
		
		for (const glyph of this.glyphs.values()) {
			const mapping = glyph.phonemeMapping ?? '';
			syllableMap.set(mapping, glyph);
			
			if (mapping.length > 1) {
				consonantSet.add(mapping[0]);
			}
		}
		
		const consonants = Array.from(consonantSet).sort();
		
		const rows: { label: string; cells: (Glyph | null)[] }[] = [];
		
		for (const consonant of consonants) {
			const cells: (Glyph | null)[] = [];
			for (const vowel of vowelOrder) {
				cells.push(syllableMap.get(consonant + vowel) ?? null);
			}
			rows.push({ label: consonant.toUpperCase(), cells });
		}
		
		const vowelRow: (Glyph | null)[] = vowelOrder.map(v => syllableMap.get(v) ?? null);
		rows.unshift({ label: '', cells: vowelRow });
		
		return {
			headers: vowelOrder.map(v => v.toUpperCase()),
			rows
		};
	}
	
	validateRomanization(rules: RomanizationRule[]): { valid: boolean; errors: string[] } {
		const errors: string[] = [];
		const seenNative = new Set<string>();
		
		for (const rule of rules) {
			if (!rule.nativeForm) {
				errors.push('Rule missing native form');
			}
			if (!rule.romanizedForm && rule.romanizedForm !== '') {
				errors.push('Rule missing romanized form');
			}
			if (seenNative.has(rule.nativeForm) && !rule.environment) {
				errors.push(`Duplicate rule for "${rule.nativeForm}" without environment distinction`);
			}
			seenNative.add(rule.nativeForm);
		}
		
		return { valid: errors.length === 0, errors };
	}
}
