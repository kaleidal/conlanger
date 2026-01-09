import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { scripts, glyphs, romanizationRules } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const [script] = await db.select().from(scripts).where(eq(scripts.id, params.scriptId));
	if (!script) throw error(404, 'Script not found');

	const [scriptGlyphs, scriptRomanization] = await Promise.all([
		db.select().from(glyphs).where(eq(glyphs.scriptId, params.scriptId)).orderBy(glyphs.sortOrder),
		db.select().from(romanizationRules).where(eq(romanizationRules.scriptId, params.scriptId)).orderBy(romanizationRules.priority)
	]);

	return json({
		...script,
		glyphs: scriptGlyphs,
		romanizationRules: scriptRomanization
	});
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
		.where(eq(scripts.id, params.scriptId))
		.returning();
	
	if (!updated) throw error(404, 'Script not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const [deleted] = await db.delete(scripts)
		.where(eq(scripts.id, params.scriptId))
		.returning();
	if (!deleted) throw error(404, 'Script not found');
	return json({ success: true });
};
