import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { inflectedForms } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(inflectedForms)
		.where(eq(inflectedForms.wordId, params.wordId));
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newForm] = await db.insert(inflectedForms).values({
		wordId: params.wordId,
		form: body.form,
		ipa: body.ipa,
		grammaticalFeatures: body.grammaticalFeatures,
		isIrregular: body.isIrregular ?? false
	}).returning();
	return json(newForm, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(inflectedForms)
		.set({
			form: body.form,
			ipa: body.ipa,
			grammaticalFeatures: body.grammaticalFeatures,
			isIrregular: body.isIrregular
		})
		.where(eq(inflectedForms.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Inflected form not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(inflectedForms)
		.where(eq(inflectedForms.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Inflected form not found');
	return json({ success: true });
};
