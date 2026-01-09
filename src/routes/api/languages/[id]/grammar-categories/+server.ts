import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { grammarCategories } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(grammarCategories)
		.where(eq(grammarCategories.languageId, params.id));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newCategory] = await db.insert(grammarCategories).values({
		languageId: params.id,
		name: body.name,
		abbreviation: body.abbreviation,
		description: body.description,
		values: body.values,
		appliesTo: body.appliesTo
	}).returning();
	return json(newCategory, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(grammarCategories)
		.set({
			name: body.name,
			abbreviation: body.abbreviation,
			description: body.description,
			values: body.values,
			appliesTo: body.appliesTo
		})
		.where(eq(grammarCategories.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Grammar category not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(grammarCategories)
		.where(eq(grammarCategories.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Grammar category not found');
	return json({ success: true });
};
