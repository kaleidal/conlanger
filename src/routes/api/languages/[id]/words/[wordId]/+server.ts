import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { words, inflectedForms, wordRelationships } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const [word] = await db.select().from(words).where(eq(words.id, params.wordId));
	if (!word) throw error(404, 'Word not found');

	const [forms, relationsFrom, relationsTo] = await Promise.all([
		db.select().from(inflectedForms).where(eq(inflectedForms.wordId, params.wordId)),
		db.select().from(wordRelationships).where(eq(wordRelationships.fromWordId, params.wordId)),
		db.select().from(wordRelationships).where(eq(wordRelationships.toWordId, params.wordId))
	]);

	return json({
		...word,
		inflectedForms: forms,
		relations: [...relationsFrom, ...relationsTo]
	});
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(words)
		.set({
			lemma: body.lemma,
			ipa: body.ipa,
			romanization: body.romanization,
			wordClass: body.wordClass,
			inflectionClassId: body.inflectionClassId,
			definitions: body.definitions,
			etymology: body.etymology,
			morphologicalAnalysis: body.morphologicalAnalysis,
			notes: body.notes,
			tags: body.tags,
			semanticFields: body.semanticFields,
			usageNotes: body.usageNotes,
			updatedAt: new Date()
		})
		.where(eq(words.id, params.wordId))
		.returning();
	
	if (!updated) throw error(404, 'Word not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const [deleted] = await db.delete(words)
		.where(eq(words.id, params.wordId))
		.returning();
	if (!deleted) throw error(404, 'Word not found');
	return json({ success: true });
};
