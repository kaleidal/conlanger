import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { phonotactics } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(phonotactics)
		.where(eq(phonotactics.languageId, params.id));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newRule] = await db.insert(phonotactics).values({
		languageId: params.id,
		name: body.name,
		pattern: body.pattern,
		description: body.description,
		syllablePosition: body.syllablePosition,
		isRequired: body.isRequired,
		examples: body.examples
	}).returning();
	return json(newRule, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(phonotactics)
		.set({
			name: body.name,
			pattern: body.pattern,
			description: body.description,
			syllablePosition: body.syllablePosition,
			isRequired: body.isRequired,
			examples: body.examples
		})
		.where(eq(phonotactics.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Phonotactic rule not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(phonotactics)
		.where(eq(phonotactics.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Phonotactic rule not found');
	return json({ success: true });
};
