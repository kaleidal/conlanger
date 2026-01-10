import { writable, derived, get } from 'svelte/store';
import { convex, runQuery, runMutation, getUserId, createConvexStore } from '$lib/convex';

export interface Language {
	_id: string;
	ownerId: string;
	name: string;
	nativeName?: string;
	description?: string;
	isoCode?: string;
	isPublic: boolean;
	settings?: Record<string, unknown>;
	createdAt?: number;
	updatedAt?: number;
	owner?: {
		displayName: string;
		handle: string;
		avatarUrl?: string;
	};
	access?: {
		canRead: boolean;
		canWrite: boolean;
		isOwner: boolean;
	};
	role?: 'owner' | 'editor' | 'viewer';
}

export interface Phoneme {
	_id: string;
	languageId: string;
	symbol: string;
	type: 'consonant' | 'vowel';
	ipa: string;
	romanization?: string;
	features?: Record<string, unknown>;
	sortOrder: number;
}

export interface Word {
	_id: string;
	languageId: string;
	lemma: string;
	ipa?: string;
	romanization?: string;
	wordClass: string;
	definitions?: { meaning: string }[];
	createdAt: number;
	updatedAt: number;
}

export interface Presence {
	_id: string;
	languageId: string;
	userId: string;
	sessionId: string;
	currentPage: string;
	currentElement?: string;
	cursorPosition?: { x: number; y: number };
	lastSeen: number;
	color: string;
	user?: {
		displayName: string;
		handle: string;
		avatarUrl?: string;
	};
}

export interface Activity {
	_id: string;
	languageId: string;
	userId: string;
	action: string;
	entityType: string;
	entityId: string;
	details?: string;
	timestamp: number;
	user?: {
		displayName: string;
		handle: string;
		avatarUrl?: string;
	};
}

// Current language store with all related data
function createLanguageStore() {
	const { subscribe, set, update } = writable<Language | null>(null);
	
	let unsubscribe: (() => void) | null = null;
	
	return {
		subscribe,
		set,
		update,
		
		async load(id: string) {
			if (!id) {
				set(null);
				return null;
			}
			
			try {
				const userId = getUserId();
				const language = await runQuery<Language>('languages:getLanguage', { 
					languageId: id,
					userId 
				});
				set(language);
				
				// Set up real-time subscription
				if (unsubscribe) unsubscribe();
				unsubscribe = convex.onUpdate(
					'languages:getLanguage' as any,
					{ languageId: id, userId },
					(result: Language) => set(result)
				);
				
				return language;
			} catch (e) {
				console.error('Failed to load language:', e);
				set(null);
				return null;
			}
		},
		
		async save(updates: Partial<Language>) {
			const current = get({ subscribe });
			if (!current?._id) throw new Error('No language loaded');
			
			const userId = getUserId();
			if (!userId) throw new Error('Not authenticated');
			
			await runMutation('languages:updateLanguage', {
				languageId: current._id,
				userId,
				...updates
			});
		},
		
		clear() {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			set(null);
		}
	};
}

// Languages list store
function createLanguagesStore() {
	const { subscribe, set, update } = writable<Language[]>([]);
	
	let unsubscribe: (() => void) | null = null;
	
	return {
		subscribe,
		set,
		update,
		
		async load() {
			const userId = getUserId();
			const languages = await runQuery<Language[]>('languages:listLanguages', { userId });
			set(languages || []);
			
			// Set up real-time subscription
			if (unsubscribe) unsubscribe();
			unsubscribe = convex.onUpdate(
				'languages:listLanguages' as any,
				{ userId },
				(result: Language[]) => set(result || [])
			);
			
			return languages;
		},
		
		async create(language: { name: string; nativeName?: string; description?: string; isPublic?: boolean }) {
			const userId = getUserId();
			if (!userId) throw new Error('Not authenticated');
			
			const id = await runMutation<string>('languages:createLanguage', {
				userId,
				...language
			});
			return { id };
		},
		
		async delete(id: string) {
			const userId = getUserId();
			if (!userId) throw new Error('Not authenticated');
			
			await runMutation('languages:deleteLanguage', {
				languageId: id,
				userId
			});
		},
		
		cleanup() {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
		}
	};
}

// Presence store for real-time collaboration
function createPresenceStore() {
	const { subscribe, set } = writable<Presence[]>([]);
	
	let unsubscribe: (() => void) | null = null;
	let updateInterval: ReturnType<typeof setInterval> | null = null;
	
	return {
		subscribe,
		
		start(languageId: string, sessionId: string) {
			const userId = getUserId();
			if (!userId) return;
			
			// Subscribe to presence updates
			if (unsubscribe) unsubscribe();
			unsubscribe = convex.onUpdate(
				'presence:getPresence' as any,
				{ languageId },
				(result: Presence[]) => set(result || [])
			);
			
			// Update presence periodically
			const updatePresence = async (page: string, element?: string) => {
				try {
					await runMutation('presence:updatePresence', {
						languageId,
						userId,
						sessionId,
						currentPage: page,
						currentElement: element
					});
				} catch (e) {
					console.error('Failed to update presence:', e);
				}
			};
			
			// Initial update
			updatePresence(window.location.pathname);
			
			// Heartbeat every 10 seconds
			updateInterval = setInterval(() => {
				updatePresence(window.location.pathname);
			}, 10000);
			
			return updatePresence;
		},
		
		async stop(sessionId: string) {
			if (updateInterval) {
				clearInterval(updateInterval);
				updateInterval = null;
			}
			
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			
			try {
				await runMutation('presence:removePresence', { sessionId });
			} catch (e) {
				console.error('Failed to remove presence:', e);
			}
			
			set([]);
		}
	};
}

// Activity log store
function createActivityStore() {
	const { subscribe, set } = writable<Activity[]>([]);
	
	let unsubscribe: (() => void) | null = null;
	
	return {
		subscribe,
		
		start(languageId: string) {
			if (unsubscribe) unsubscribe();
			unsubscribe = convex.onUpdate(
				'presence:getActivityLog' as any,
				{ languageId, limit: 50 },
				(result: Activity[]) => set(result || [])
			);
		},
		
		stop() {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			set([]);
		}
	};
}

export const currentLanguage = createLanguageStore();
export const languages = createLanguagesStore();
export const presence = createPresenceStore();
export const activityLog = createActivityStore();

export const languageStats = derived(currentLanguage, $language => {
	if (!$language) return null;
	
	return {
		name: $language.name,
		isPublic: $language.isPublic,
		canEdit: $language.access?.canWrite ?? false,
		isOwner: $language.access?.isOwner ?? false
	};
});
