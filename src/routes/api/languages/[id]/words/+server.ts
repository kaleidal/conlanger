import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { words, inflectedForms, wordRelationships } from '$lib/server/schema';
import { eq, ilike, or, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, url }) => {
	const search = url.searchParams.get('search');
	const wordClass = url.searchParams.get('wordClass');
	const tag = url.searchParams.get('tag');
	const limit = parseInt(url.searchParams.get('limit') ?? '100');
	const offset = parseInt(url.searchParams.get('offset') ?? '0');

	let query = db.select().from(words).where(eq(words.languageId, params.id));

	const conditions = [eq(words.languageId, params.id)];

	if (search) {
		conditions.push(or(
			ilike(words.lemma, `%${search}%`),
			ilike(words.romanization, `%${search}%`)
		)!);
	}

	if (wordClass) {
		conditions.push(eq(words.wordClass, wordClass as any));
	}

	const result = await db.select().from(words)
		.where(and(...conditions))
		.limit(limit)
		.offset(offset)
		.orderBy(words.lemma);

	const countResult = await db.select({ count: sql<number>`count(*)` })
		.from(words)
		.where(and(...conditions));

	return json({
		words: result,
		total: countResult[0].count,
		limit,
		offset
	});
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newWord] = await db.insert(words).values({
		languageId: params.id,
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
		usageNotes: body.usageNotes
	}).returning();
	return json(newWord, { status: 201 });
};
