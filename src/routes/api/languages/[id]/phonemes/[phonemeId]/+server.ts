import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { phonemes } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(phonemes)
		.set({
			symbol: body.symbol,
			type: body.type,
			ipa: body.ipa,
			romanization: body.romanization,
			features: body.features,
			description: body.description,
			sortOrder: body.sortOrder
		})
		.where(eq(phonemes.id, params.phonemeId))
		.returning();
	
	if (!updated) throw error(404, 'Phoneme not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const [deleted] = await db.delete(phonemes)
		.where(eq(phonemes.id, params.phonemeId))
		.returning();
	if (!deleted) throw error(404, 'Phoneme not found');
	return json({ success: true });
};
