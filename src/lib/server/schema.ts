import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const phonemeTypeEnum = pgEnum('phoneme_type', ['consonant', 'vowel']);
export const affixTypeEnum = pgEnum('affix_type', ['prefix', 'suffix', 'infix', 'circumfix', 'interfix', 'suprafix', 'transfix']);
export const wordClassEnum = pgEnum('word_class', ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'determiner', 'preposition', 'postposition', 'conjunction', 'interjection', 'particle', 'numeral', 'classifier', 'auxiliary', 'copula', 'other']);
export const scriptTypeEnum = pgEnum('script_type', ['alphabet', 'abjad', 'abugida', 'syllabary', 'logographic', 'featural', 'mixed']);
export const wordRelationTypeEnum = pgEnum('word_relation_type', ['synonym', 'antonym', 'hypernym', 'hyponym', 'meronym', 'holonym', 'derived', 'compound', 'cognate', 'doublet']);

export const languages = pgTable('languages', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	nativeName: text('native_name'),
	description: text('description'),
	isoCode: text('iso_code'),
	parentLanguageId: uuid('parent_language_id'),
	settings: jsonb('settings').$type<LanguageSettings>(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const languageRelations = relations(languages, ({ one, many }) => ({
	parent: one(languages, { fields: [languages.parentLanguageId], references: [languages.id] }),
	phonemes: many(phonemes),
	allophones: many(allophones),
	phonotactics: many(phonotactics),
	soundChanges: many(soundChanges),
	morphemes: many(morphemes),
	inflectionClasses: many(inflectionClasses),
	grammarCategories: many(grammarCategories),
	syntaxRules: many(syntaxRules),
	words: many(words),
	scripts: many(scripts),
	texts: many(texts)
}));

export const phonemes = pgTable('phonemes', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	symbol: text('symbol').notNull(),
	type: phonemeTypeEnum('type').notNull(),
	ipa: text('ipa').notNull(),
	romanization: text('romanization'),
	features: jsonb('features').$type<PhonemeFeatures>(),
	description: text('description'),
	sortOrder: integer('sort_order').default(0)
});

export const phonemeRelations = relations(phonemes, ({ one, many }) => ({
	language: one(languages, { fields: [phonemes.languageId], references: [languages.id] }),
	allophones: many(allophones)
}));

export const allophones = pgTable('allophones', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	phonemeId: uuid('phoneme_id').notNull().references(() => phonemes.id, { onDelete: 'cascade' }),
	symbol: text('symbol').notNull(),
	ipa: text('ipa').notNull(),
	environment: text('environment').notNull(),
	environmentDescription: text('environment_description'),
	features: jsonb('features').$type<PhonemeFeatures>()
});

export const allophoneRelations = relations(allophones, ({ one }) => ({
	language: one(languages, { fields: [allophones.languageId], references: [languages.id] }),
	phoneme: one(phonemes, { fields: [allophones.phonemeId], references: [phonemes.id] })
}));

export const phonotactics = pgTable('phonotactics', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	pattern: text('pattern').notNull(),
	description: text('description'),
	syllablePosition: text('syllable_position'),
	isRequired: boolean('is_required').default(false),
	examples: jsonb('examples').$type<string[]>()
});

export const phonotacticsRelations = relations(phonotactics, ({ one }) => ({
	language: one(languages, { fields: [phonotactics.languageId], references: [languages.id] })
}));

export const soundChanges = pgTable('sound_changes', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	fromPattern: text('from_pattern').notNull(),
	toPattern: text('to_pattern').notNull(),
	environment: text('environment'),
	description: text('description'),
	orderIndex: integer('order_index').default(0),
	isActive: boolean('is_active').default(true),
	era: text('era'),
	exceptions: jsonb('exceptions').$type<string[]>()
});

export const soundChangeRelations = relations(soundChanges, ({ one }) => ({
	language: one(languages, { fields: [soundChanges.languageId], references: [languages.id] })
}));

export const grammarCategories = pgTable('grammar_categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	abbreviation: text('abbreviation'),
	description: text('description'),
	values: jsonb('values').$type<GrammarValue[]>(),
	appliesTo: jsonb('applies_to').$type<string[]>()
});

export const grammarCategoryRelations = relations(grammarCategories, ({ one }) => ({
	language: one(languages, { fields: [grammarCategories.languageId], references: [languages.id] })
}));

export const morphemes = pgTable('morphemes', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	form: text('form').notNull(),
	gloss: text('gloss').notNull(),
	type: affixTypeEnum('type').notNull(),
	allomorphs: jsonb('allomorphs').$type<Allomorph[]>(),
	grammaticalMeaning: jsonb('grammatical_meaning').$type<Record<string, string>>(),
	phonologicalCondition: text('phonological_condition'),
	description: text('description')
});

export const morphemeRelations = relations(morphemes, ({ one }) => ({
	language: one(languages, { fields: [morphemes.languageId], references: [languages.id] })
}));

export const inflectionClasses = pgTable('inflection_classes', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	wordClass: wordClassEnum('word_class').notNull(),
	description: text('description'),
	paradigm: jsonb('paradigm').$type<ParadigmCell[]>()
});

export const inflectionClassRelations = relations(inflectionClasses, ({ one }) => ({
	language: one(languages, { fields: [inflectionClasses.languageId], references: [languages.id] })
}));

export const syntaxRules = pgTable('syntax_rules', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	ruleType: text('rule_type').notNull(),
	pattern: text('pattern').notNull(),
	output: text('output'),
	conditions: jsonb('conditions').$type<SyntaxCondition[]>(),
	description: text('description'),
	examples: jsonb('examples').$type<SyntaxExample[]>(),
	orderIndex: integer('order_index').default(0)
});

export const syntaxRuleRelations = relations(syntaxRules, ({ one }) => ({
	language: one(languages, { fields: [syntaxRules.languageId], references: [languages.id] })
}));

export const words = pgTable('words', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	lemma: text('lemma').notNull(),
	ipa: text('ipa'),
	romanization: text('romanization'),
	wordClass: wordClassEnum('word_class').notNull(),
	inflectionClassId: uuid('inflection_class_id').references(() => inflectionClasses.id),
	definitions: jsonb('definitions').$type<Definition[]>(),
	etymology: jsonb('etymology').$type<Etymology>(),
	morphologicalAnalysis: text('morphological_analysis'),
	notes: text('notes'),
	tags: jsonb('tags').$type<string[]>(),
	semanticFields: jsonb('semantic_fields').$type<string[]>(),
	usageNotes: text('usage_notes'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const wordRelations = relations(words, ({ one, many }) => ({
	language: one(languages, { fields: [words.languageId], references: [languages.id] }),
	inflectionClass: one(inflectionClasses, { fields: [words.inflectionClassId], references: [inflectionClasses.id] }),
	inflectedForms: many(inflectedForms),
	relationsFrom: many(wordRelationships, { relationName: 'fromWord' }),
	relationsTo: many(wordRelationships, { relationName: 'toWord' })
}));

export const inflectedForms = pgTable('inflected_forms', {
	id: uuid('id').defaultRandom().primaryKey(),
	wordId: uuid('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
	form: text('form').notNull(),
	ipa: text('ipa'),
	grammaticalFeatures: jsonb('grammatical_features').$type<Record<string, string>>(),
	isIrregular: boolean('is_irregular').default(false)
});

export const inflectedFormRelations = relations(inflectedForms, ({ one }) => ({
	word: one(words, { fields: [inflectedForms.wordId], references: [words.id] })
}));

export const wordRelationships = pgTable('word_relationships', {
	id: uuid('id').defaultRandom().primaryKey(),
	fromWordId: uuid('from_word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
	toWordId: uuid('to_word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
	relationType: wordRelationTypeEnum('relation_type').notNull(),
	notes: text('notes')
});

export const wordRelationshipRelations = relations(wordRelationships, ({ one }) => ({
	fromWord: one(words, { fields: [wordRelationships.fromWordId], references: [words.id], relationName: 'fromWord' }),
	toWord: one(words, { fields: [wordRelationships.toWordId], references: [words.id], relationName: 'toWord' })
}));

export const scripts = pgTable('scripts', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	type: scriptTypeEnum('type').notNull(),
	description: text('description'),
	direction: text('direction').default('ltr'),
	baselinePosition: text('baseline_position'),
	settings: jsonb('settings').$type<ScriptSettings>()
});

export const scriptRelations = relations(scripts, ({ one, many }) => ({
	language: one(languages, { fields: [scripts.languageId], references: [languages.id] }),
	glyphs: many(glyphs),
	romanizationRules: many(romanizationRules)
}));

export const glyphs = pgTable('glyphs', {
	id: uuid('id').defaultRandom().primaryKey(),
	scriptId: uuid('script_id').notNull().references(() => scripts.id, { onDelete: 'cascade' }),
	character: text('character'),
	svgPath: text('svg_path'),
	unicodePoint: text('unicode_point'),
	phonemeMapping: text('phoneme_mapping'),
	name: text('name'),
	variants: jsonb('variants').$type<GlyphVariant[]>(),
	sortOrder: integer('sort_order').default(0)
});

export const glyphRelations = relations(glyphs, ({ one }) => ({
	script: one(scripts, { fields: [glyphs.scriptId], references: [scripts.id] })
}));

export const romanizationRules = pgTable('romanization_rules', {
	id: uuid('id').defaultRandom().primaryKey(),
	scriptId: uuid('script_id').notNull().references(() => scripts.id, { onDelete: 'cascade' }),
	nativeForm: text('native_form').notNull(),
	romanizedForm: text('romanized_form').notNull(),
	environment: text('environment'),
	priority: integer('priority').default(0)
});

export const romanizationRuleRelations = relations(romanizationRules, ({ one }) => ({
	script: one(scripts, { fields: [romanizationRules.scriptId], references: [scripts.id] })
}));

export const texts = pgTable('texts', {
	id: uuid('id').defaultRandom().primaryKey(),
	languageId: uuid('language_id').notNull().references(() => languages.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	originalText: text('original_text'),
	translatedText: text('translated_text'),
	interlinearData: jsonb('interlinear_data').$type<InterlinearData[]>(),
	notes: text('notes'),
	source: text('source'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const textRelations = relations(texts, ({ one }) => ({
	language: one(languages, { fields: [texts.languageId], references: [languages.id] })
}));

export interface LanguageSettings {
	wordOrder?: string;
	headDirection?: string;
	morphologicalType?: string;
	alignment?: string;
	defaultScript?: string;
	stressPattern?: string;
	toneSystem?: ToneSystem;
}

export interface ToneSystem {
	hasTone: boolean;
	toneCount?: number;
	toneMarking?: string;
	tones?: ToneDefinition[];
}

export interface ToneDefinition {
	name: string;
	contour: string;
	diacritic?: string;
	number?: number;
}

export interface PhonemeFeatures {
	manner?: string;
	place?: string;
	voicing?: string;
	height?: string;
	backness?: string;
	roundedness?: string;
	length?: string;
	nasalization?: boolean;
	aspiration?: boolean;
	palatalization?: boolean;
	labialization?: boolean;
	pharyngealization?: boolean;
	glottalization?: boolean;
	tone?: string;
	[key: string]: string | boolean | undefined;
}

export interface GrammarValue {
	name: string;
	abbreviation: string;
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

export interface Definition {
	meaning: string;
	partOfSpeech?: string;
	examples?: string[];
	register?: string;
	domain?: string;
}

export interface Etymology {
	origin?: string;
	protoForm?: string;
	borrowedFrom?: string;
	cognates?: CognateInfo[];
	soundChanges?: string[];
	notes?: string;
}

export interface CognateInfo {
	language: string;
	form: string;
	meaning?: string;
}

export interface ScriptSettings {
	fontSize?: number;
	lineHeight?: number;
	letterSpacing?: number;
	customFont?: string;
}

export interface GlyphVariant {
	position: string;
	form: string;
	svgPath?: string;
}

export interface InterlinearData {
	morphemes: InterlinearMorpheme[];
	translation: string;
}

export interface InterlinearMorpheme {
	surface: string;
	underlying?: string;
	gloss: string;
	wordId?: string;
}
