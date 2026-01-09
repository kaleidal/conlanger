import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { glyphs } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(glyphs)
		.where(eq(glyphs.scriptId, params.scriptId))
		.orderBy(glyphs.sortOrder);
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newGlyph] = await db.insert(glyphs).values({
		scriptId: params.scriptId,
		character: body.character,
		svgPath: body.svgPath,
		unicodePoint: body.unicodePoint,
		phonemeMapping: body.phonemeMapping,
		name: body.name,
		variants: body.variants,
		sortOrder: body.sortOrder ?? 0
	}).returning();
	return json(newGlyph, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(glyphs)
		.set({
			character: body.character,
			svgPath: body.svgPath,
			unicodePoint: body.unicodePoint,
			phonemeMapping: body.phonemeMapping,
			name: body.name,
			variants: body.variants,
			sortOrder: body.sortOrder
		})
		.where(eq(glyphs.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Glyph not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(glyphs)
		.where(eq(glyphs.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Glyph not found');
	return json({ success: true });
};
