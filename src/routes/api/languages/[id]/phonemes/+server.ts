import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { phonemes } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(phonemes)
		.where(eq(phonemes.languageId, params.id))
		.orderBy(phonemes.sortOrder);
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newPhoneme] = await db.insert(phonemes).values({
		languageId: params.id,
		symbol: body.symbol,
		type: body.type,
		ipa: body.ipa,
		romanization: body.romanization,
		features: body.features,
		description: body.description,
		sortOrder: body.sortOrder ?? 0
	}).returning();
	return json(newPhoneme, { status: 201 });
};
