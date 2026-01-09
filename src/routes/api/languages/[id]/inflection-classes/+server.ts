import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { inflectionClasses } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(inflectionClasses)
		.where(eq(inflectionClasses.languageId, params.id));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newClass] = await db.insert(inflectionClasses).values({
		languageId: params.id,
		name: body.name,
		wordClass: body.wordClass,
		description: body.description,
		paradigm: body.paradigm
	}).returning();
	return json(newClass, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(inflectionClasses)
		.set({
			name: body.name,
			wordClass: body.wordClass,
			description: body.description,
			paradigm: body.paradigm
		})
		.where(eq(inflectionClasses.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Inflection class not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(inflectionClasses)
		.where(eq(inflectionClasses.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Inflection class not found');
	return json({ success: true });
};
