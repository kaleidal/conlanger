import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { texts } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(texts)
		.where(eq(texts.languageId, params.id))
		.orderBy(texts.createdAt);
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newText] = await db.insert(texts).values({
		languageId: params.id,
		title: body.title,
		originalText: body.originalText,
		translatedText: body.translatedText,
		interlinearData: body.interlinearData,
		notes: body.notes,
		source: body.source
	}).returning();
	return json(newText, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(texts)
		.set({
			title: body.title,
			originalText: body.originalText,
			translatedText: body.translatedText,
			interlinearData: body.interlinearData,
			notes: body.notes,
			source: body.source,
			updatedAt: new Date()
		})
		.where(eq(texts.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Text not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(texts)
		.where(eq(texts.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Text not found');
	return json({ success: true });
};
