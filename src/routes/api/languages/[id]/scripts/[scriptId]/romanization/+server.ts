import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { romanizationRules } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(romanizationRules)
		.where(eq(romanizationRules.scriptId, params.scriptId))
		.orderBy(romanizationRules.priority);
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newRule] = await db.insert(romanizationRules).values({
		scriptId: params.scriptId,
		nativeForm: body.nativeForm,
		romanizedForm: body.romanizedForm,
		environment: body.environment,
		priority: body.priority ?? 0
	}).returning();
	return json(newRule, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(romanizationRules)
		.set({
			nativeForm: body.nativeForm,
			romanizedForm: body.romanizedForm,
			environment: body.environment,
			priority: body.priority
		})
		.where(eq(romanizationRules.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Romanization rule not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(romanizationRules)
		.where(eq(romanizationRules.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Romanization rule not found');
	return json({ success: true });
};
