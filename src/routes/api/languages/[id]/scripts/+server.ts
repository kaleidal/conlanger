import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { scripts, glyphs, romanizationRules } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(scripts)
		.where(eq(scripts.languageId, params.id));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newScript] = await db.insert(scripts).values({
		languageId: params.id,
		name: body.name,
		type: body.type,
		description: body.description,
		direction: body.direction ?? 'ltr',
		baselinePosition: body.baselinePosition,
		settings: body.settings
	}).returning();
	return json(newScript, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(scripts)
		.set({
			name: body.name,
			type: body.type,
			description: body.description,
			direction: body.direction,
			baselinePosition: body.baselinePosition,
			settings: body.settings
		})
		.where(eq(scripts.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Script not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(scripts)
		.where(eq(scripts.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Script not found');
	return json({ success: true });
};
