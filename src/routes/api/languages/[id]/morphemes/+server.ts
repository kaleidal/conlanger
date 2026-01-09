import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { morphemes } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(morphemes)
		.where(eq(morphemes.languageId, params.id));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newMorpheme] = await db.insert(morphemes).values({
		languageId: params.id,
		form: body.form,
		gloss: body.gloss,
		type: body.type,
		allomorphs: body.allomorphs,
		grammaticalMeaning: body.grammaticalMeaning,
		phonologicalCondition: body.phonologicalCondition,
		description: body.description
	}).returning();
	return json(newMorpheme, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(morphemes)
		.set({
			form: body.form,
			gloss: body.gloss,
			type: body.type,
			allomorphs: body.allomorphs,
			grammaticalMeaning: body.grammaticalMeaning,
			phonologicalCondition: body.phonologicalCondition,
			description: body.description
		})
		.where(eq(morphemes.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Morpheme not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(morphemes)
		.where(eq(morphemes.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Morpheme not found');
	return json({ success: true });
};
