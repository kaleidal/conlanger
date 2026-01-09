import { writable, derived } from 'svelte/store';

export interface Language {
	id: string;
	name: string;
	nativeName?: string;
	description?: string;
	settings?: Record<string, unknown>;
	phonemes?: Phoneme[];
	allophones?: unknown[];
	phonotactics?: unknown[];
	soundChanges?: unknown[];
	morphemes?: unknown[];
	grammarCategories?: unknown[];
	inflectionClasses?: unknown[];
	syntaxRules?: unknown[];
	words?: Word[];
	scripts?: unknown[];
	texts?: unknown[];
	createdAt?: string;
	updatedAt?: string;
}

export interface Phoneme {
	id: string;
	symbol: string;
	type: 'consonant' | 'vowel';
	ipa: string;
	romanization?: string;
	features?: Record<string, unknown>;
}

export interface Word {
	id: string;
	lemma: string;
	ipa?: string;
	romanization?: string;
	wordClass: string;
	definitions?: { meaning: string }[];
}

function createLanguageStore() {
	const { subscribe, set, update } = writable<Language | null>(null);
	
	return {
		subscribe,
		set,
		update,
		
		async load(id: string) {
			const response = await fetch(`/api/languages/${id}`);
			if (response.ok) {
				const language = await response.json();
				set(language);
				return language;
			}
			throw new Error('Failed to load language');
		},
		
		async save(language: Partial<Language>) {
			const current = await new Promise<Language | null>(resolve => {
				subscribe(value => resolve(value))();
			});
			
			if (current?.id) {
				const response = await fetch(`/api/languages/${current.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(language)
				});
				if (response.ok) {
					const updated = await response.json();
					update(lang => lang ? { ...lang, ...updated } : null);
					return updated;
				}
			}
			throw new Error('Failed to save language');
		},
		
		clear() {
			set(null);
		}
	};
}

function createLanguagesStore() {
	const { subscribe, set, update } = writable<Language[]>([]);
	
	return {
		subscribe,
		set,
		update,
		
		async load() {
			const response = await fetch('/api/languages');
			if (response.ok) {
				const languages = await response.json();
				set(languages);
				return languages;
			}
			throw new Error('Failed to load languages');
		},
		
		async create(language: Partial<Language>) {
			const response = await fetch('/api/languages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(language)
			});
			if (response.ok) {
				const created = await response.json();
				update(languages => [...languages, created]);
				return created;
			}
			throw new Error('Failed to create language');
		},
		
		async delete(id: string) {
			const response = await fetch(`/api/languages/${id}`, {
				method: 'DELETE'
			});
			if (response.ok) {
				update(languages => languages.filter(l => l.id !== id));
				return true;
			}
			throw new Error('Failed to delete language');
		}
	};
}

export const currentLanguage = createLanguageStore();
export const languages = createLanguagesStore();

export const languageStats = derived(currentLanguage, $language => {
	if (!$language) return null;
	
	return {
		phonemeCount: $language.phonemes?.length ?? 0,
		wordCount: $language.words?.length ?? 0
	};
});
