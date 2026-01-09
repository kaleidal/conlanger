import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { allophones } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(allophones)
		.where(eq(allophones.languageId, params.id));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newAllophone] = await db.insert(allophones).values({
		languageId: params.id,
		phonemeId: body.phonemeId,
		symbol: body.symbol,
		ipa: body.ipa,
		environment: body.environment,
		environmentDescription: body.environmentDescription,
		features: body.features
	}).returning();
	return json(newAllophone, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(allophones)
		.set({
			phonemeId: body.phonemeId,
			symbol: body.symbol,
			ipa: body.ipa,
			environment: body.environment,
			environmentDescription: body.environmentDescription,
			features: body.features
		})
		.where(eq(allophones.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Allophone not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(allophones)
		.where(eq(allophones.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Allophone not found');
	return json({ success: true });
};
