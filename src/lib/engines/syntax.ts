export interface SyntaxRule {
	id?: string;
	name: string;
	ruleType: string;
	pattern: string;
	output?: string;
	conditions?: SyntaxCondition[];
	description?: string;
	examples?: SyntaxExample[];
	orderIndex?: number;
}

export interface SyntaxCondition {
	type: string;
	value: string;
	operator?: string;
}

export interface SyntaxExample {
	input: string;
	output: string;
	gloss?: string;
	translation?: string;
}

export interface Constituent {
	type: string;
	value?: string;
	features?: Record<string, string>;
	children?: Constituent[];
	head?: boolean;
}

export interface SyntaxTree {
	root: Constituent;
}

export type WordOrder = 'SOV' | 'SVO' | 'VSO' | 'VOS' | 'OVS' | 'OSV' | 'free';
export type HeadDirection = 'head-initial' | 'head-final' | 'mixed';
export type NounPhraseOrder = {
	determiner: 'before' | 'after';
	adjective: 'before' | 'after';
	numeral: 'before' | 'after';
	genitive: 'before' | 'after';
	relative: 'before' | 'after';
};

export interface SyntaxSettings {
	wordOrder: WordOrder;
	headDirection: HeadDirection;
	nounPhraseOrder: NounPhraseOrder;
	adpositionType: 'preposition' | 'postposition' | 'mixed';
	auxiliaryPosition: 'before' | 'after';
	negationPosition: 'before' | 'after' | 'double';
	questionFormation: 'inversion' | 'particle' | 'intonation' | 'in-situ';
	proDropSubject: boolean;
	proDropObject: boolean;
	nullCopula: boolean;
	serialVerbs: boolean;
}

export const DEFAULT_SYNTAX_SETTINGS: SyntaxSettings = {
	wordOrder: 'SVO',
	headDirection: 'head-initial',
	nounPhraseOrder: {
		determiner: 'before',
		adjective: 'before',
		numeral: 'before',
		genitive: 'after',
		relative: 'after'
	},
	adpositionType: 'preposition',
	auxiliaryPosition: 'before',
	negationPosition: 'before',
	questionFormation: 'inversion',
	proDropSubject: false,
	proDropObject: false,
	nullCopula: false,
	serialVerbs: false
};

export class SyntaxEngine {
	private rules: SyntaxRule[] = [];
	private settings: SyntaxSettings = DEFAULT_SYNTAX_SETTINGS;
	
	constructor(rules: SyntaxRule[] = [], settings: Partial<SyntaxSettings> = {}) {
		this.setRules(rules);
		this.setSettings(settings);
	}
	
	setRules(rules: SyntaxRule[]) {
		this.rules = [...rules].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
	}
	
	setSettings(settings: Partial<SyntaxSettings>) {
		this.settings = { ...DEFAULT_SYNTAX_SETTINGS, ...settings };
	}
	
	parsePhrase(input: string): Constituent {
		const tokens = input.trim().split(/\s+/);
		
		return {
			type: 'S',
			children: tokens.map(token => ({
				type: 'word',
				value: token
			}))
		};
	}
	
	buildSentence(constituents: { type: string; value: string }[]): string {
		const subject = constituents.find(c => c.type === 'S' || c.type === 'subject');
		const verb = constituents.find(c => c.type === 'V' || c.type === 'verb');
		const object = constituents.find(c => c.type === 'O' || c.type === 'object');
		
		const parts: string[] = [];
		
		switch (this.settings.wordOrder) {
			case 'SOV':
				if (subject) parts.push(subject.value);
				if (object) parts.push(object.value);
				if (verb) parts.push(verb.value);
				break;
			case 'SVO':
				if (subject) parts.push(subject.value);
				if (verb) parts.push(verb.value);
				if (object) parts.push(object.value);
				break;
			case 'VSO':
				if (verb) parts.push(verb.value);
				if (subject) parts.push(subject.value);
				if (object) parts.push(object.value);
				break;
			case 'VOS':
				if (verb) parts.push(verb.value);
				if (object) parts.push(object.value);
				if (subject) parts.push(subject.value);
				break;
			case 'OVS':
				if (object) parts.push(object.value);
				if (verb) parts.push(verb.value);
				if (subject) parts.push(subject.value);
				break;
			case 'OSV':
				if (object) parts.push(object.value);
				if (subject) parts.push(subject.value);
				if (verb) parts.push(verb.value);
				break;
			default:
				parts.push(...constituents.map(c => c.value));
		}
		
		return parts.join(' ');
	}
	
	buildNounPhrase(components: {
		noun: string;
		determiner?: string;
		adjectives?: string[];
		numeral?: string;
		genitive?: string;
		relative?: string;
	}): string {
		const order = this.settings.nounPhraseOrder;
		const parts: { position: number; value: string }[] = [];
		
		parts.push({ position: 50, value: components.noun });
		
		if (components.determiner) {
			parts.push({
				position: order.determiner === 'before' ? 10 : 90,
				value: components.determiner
			});
		}
		
		if (components.adjectives) {
			const adjPos = order.adjective === 'before' ? 30 : 70;
			components.adjectives.forEach((adj, i) => {
				parts.push({ position: adjPos + i * 0.1, value: adj });
			});
		}
		
		if (components.numeral) {
			parts.push({
				position: order.numeral === 'before' ? 20 : 80,
				value: components.numeral
			});
		}
		
		if (components.genitive) {
			parts.push({
				position: order.genitive === 'before' ? 40 : 60,
				value: components.genitive
			});
		}
		
		if (components.relative) {
			parts.push({
				position: order.relative === 'before' ? 5 : 95,
				value: components.relative
			});
		}
		
		return parts
			.sort((a, b) => a.position - b.position)
			.map(p => p.value)
			.join(' ');
	}
	
	buildVerbPhrase(components: {
		verb: string;
		auxiliary?: string;
		negation?: string;
		adverbs?: string[];
	}): string {
		const parts: { position: number; value: string }[] = [];
		
		parts.push({ position: 50, value: components.verb });
		
		if (components.auxiliary) {
			parts.push({
				position: this.settings.auxiliaryPosition === 'before' ? 30 : 70,
				value: components.auxiliary
			});
		}
		
		if (components.negation) {
			const negPos = this.settings.negationPosition === 'before' ? 20 : 
				this.settings.negationPosition === 'after' ? 80 : 20;
			parts.push({ position: negPos, value: components.negation });
			
			if (this.settings.negationPosition === 'double') {
				parts.push({ position: 80, value: components.negation });
			}
		}
		
		if (components.adverbs) {
			components.adverbs.forEach((adv, i) => {
				parts.push({ position: 40 + i * 0.1, value: adv });
			});
		}
		
		return parts
			.sort((a, b) => a.position - b.position)
			.map(p => p.value)
			.join(' ');
	}
	
	buildAdpositionalPhrase(adposition: string, noun: string): string {
		if (this.settings.adpositionType === 'preposition') {
			return `${adposition} ${noun}`;
		} else if (this.settings.adpositionType === 'postposition') {
			return `${noun} ${adposition}`;
		}
		return `${adposition} ${noun}`;
	}
	
	applyRule(input: Constituent, rule: SyntaxRule): Constituent {
		if (!this.checkConditions(input, rule.conditions)) {
			return input;
		}
		
		switch (rule.ruleType) {
			case 'movement':
				return this.applyMovement(input, rule);
			case 'insertion':
				return this.applyInsertion(input, rule);
			case 'deletion':
				return this.applyDeletion(input, rule);
			case 'substitution':
				return this.applySubstitution(input, rule);
			default:
				return input;
		}
	}
	
	private checkConditions(constituent: Constituent, conditions?: SyntaxCondition[]): boolean {
		if (!conditions || conditions.length === 0) return true;
		
		return conditions.every(condition => {
			switch (condition.type) {
				case 'feature':
					return constituent.features?.[condition.value] !== undefined;
				case 'type':
					return constituent.type === condition.value;
				default:
					return true;
			}
		});
	}
	
	private applyMovement(input: Constituent, rule: SyntaxRule): Constituent {
		return { ...input };
	}
	
	private applyInsertion(input: Constituent, rule: SyntaxRule): Constituent {
		if (!input.children || !rule.output) return input;
		
		return {
			...input,
			children: [
				...input.children,
				{ type: 'inserted', value: rule.output }
			]
		};
	}
	
	private applyDeletion(input: Constituent, rule: SyntaxRule): Constituent {
		if (!input.children) return input;
		
		return {
			...input,
			children: input.children.filter(c => 
				!(c.type === rule.pattern || c.value === rule.pattern)
			)
		};
	}
	
	private applySubstitution(input: Constituent, rule: SyntaxRule): Constituent {
		if (input.value === rule.pattern && rule.output) {
			return { ...input, value: rule.output };
		}
		
		if (input.children) {
			return {
				...input,
				children: input.children.map(c => this.applySubstitution(c, rule))
			};
		}
		
		return input;
	}
	
	applyAllRules(input: Constituent): Constituent {
		let result = input;
		
		for (const rule of this.rules) {
			result = this.applyRule(result, rule);
		}
		
		return result;
	}
	
	constituentsToString(constituent: Constituent): string {
		if (constituent.value) {
			return constituent.value;
		}
		
		if (constituent.children) {
			return constituent.children
				.map(c => this.constituentsToString(c))
				.join(' ');
		}
		
		return '';
	}
	
	formatTree(constituent: Constituent, indent: number = 0): string {
		const prefix = '  '.repeat(indent);
		let result = `${prefix}[${constituent.type}`;
		
		if (constituent.value) {
			result += ` ${constituent.value}`;
		}
		
		if (constituent.features && Object.keys(constituent.features).length > 0) {
			const featureStr = Object.entries(constituent.features)
				.map(([k, v]) => `${k}=${v}`)
				.join(', ');
			result += ` (${featureStr})`;
		}
		
		if (constituent.children && constituent.children.length > 0) {
			result += '\n';
			for (const child of constituent.children) {
				result += this.formatTree(child, indent + 1) + '\n';
			}
			result += `${prefix}]`;
		} else {
			result += ']';
		}
		
		return result;
	}
	
	getWordOrderDescription(): string {
		const descriptions: Record<WordOrder, string> = {
			'SOV': 'Subject-Object-Verb (like Japanese, Korean, Turkish)',
			'SVO': 'Subject-Verb-Object (like English, Chinese, Spanish)',
			'VSO': 'Verb-Subject-Object (like Arabic, Irish, Welsh)',
			'VOS': 'Verb-Object-Subject (like Malagasy, Fijian)',
			'OVS': 'Object-Verb-Subject (like Hixkaryana)',
			'OSV': 'Object-Subject-Verb (rare, some Amazonian languages)',
			'free': 'Free word order (relies on case marking)'
		};
		
		return descriptions[this.settings.wordOrder];
	}
}
