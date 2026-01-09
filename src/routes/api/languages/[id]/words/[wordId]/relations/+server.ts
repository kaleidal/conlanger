import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { wordRelationships } from '$lib/server/schema';
import { eq, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(wordRelationships)
		.where(or(
			eq(wordRelationships.fromWordId, params.wordId),
			eq(wordRelationships.toWordId, params.wordId)
		));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newRelation] = await db.insert(wordRelationships).values({
		fromWordId: params.wordId,
		toWordId: body.toWordId,
		relationType: body.relationType,
		notes: body.notes
	}).returning();
	return json(newRelation, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(wordRelationships)
		.where(eq(wordRelationships.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Word relationship not found');
	return json({ success: true });
};
