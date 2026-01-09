import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { languages, phonemes, allophones, phonotactics, soundChanges, morphemes, grammarCategories, inflectionClasses, syntaxRules, words, scripts, texts } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const [language] = await db.select().from(languages).where(eq(languages.id, params.id));
	if (!language) throw error(404, 'Language not found');
	
	const [
		languagePhonemes,
		languageAllophones,
		languagePhonotactics,
		languageSoundChanges,
		languageMorphemes,
		languageGrammarCategories,
		languageInflectionClasses,
		languageSyntaxRules,
		languageWords,
		languageScripts,
		languageTexts
	] = await Promise.all([
		db.select().from(phonemes).where(eq(phonemes.languageId, params.id)),
		db.select().from(allophones).where(eq(allophones.languageId, params.id)),
		db.select().from(phonotactics).where(eq(phonotactics.languageId, params.id)),
		db.select().from(soundChanges).where(eq(soundChanges.languageId, params.id)),
		db.select().from(morphemes).where(eq(morphemes.languageId, params.id)),
		db.select().from(grammarCategories).where(eq(grammarCategories.languageId, params.id)),
		db.select().from(inflectionClasses).where(eq(inflectionClasses.languageId, params.id)),
		db.select().from(syntaxRules).where(eq(syntaxRules.languageId, params.id)),
		db.select().from(words).where(eq(words.languageId, params.id)),
		db.select().from(scripts).where(eq(scripts.languageId, params.id)),
		db.select().from(texts).where(eq(texts.languageId, params.id))
	]);

	return json({
		...language,
		phonemes: languagePhonemes,
		allophones: languageAllophones,
		phonotactics: languagePhonotactics,
		soundChanges: languageSoundChanges,
		morphemes: languageMorphemes,
		grammarCategories: languageGrammarCategories,
		inflectionClasses: languageInflectionClasses,
		syntaxRules: languageSyntaxRules,
		words: languageWords,
		scripts: languageScripts,
		texts: languageTexts
	});
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(languages)
		.set({
			name: body.name,
			nativeName: body.nativeName,
			description: body.description,
			isoCode: body.isoCode,
			parentLanguageId: body.parentLanguageId,
			settings: body.settings,
			updatedAt: new Date()
		})
		.where(eq(languages.id, params.id))
		.returning();
	
	if (!updated) throw error(404, 'Language not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const [deleted] = await db.delete(languages).where(eq(languages.id, params.id)).returning();
	if (!deleted) throw error(404, 'Language not found');
	return json({ success: true });
};
