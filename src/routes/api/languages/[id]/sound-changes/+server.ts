import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { soundChanges } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(soundChanges)
		.where(eq(soundChanges.languageId, params.id))
		.orderBy(soundChanges.orderIndex);
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newRule] = await db.insert(soundChanges).values({
		languageId: params.id,
		name: body.name,
		fromPattern: body.fromPattern,
		toPattern: body.toPattern,
		environment: body.environment,
		description: body.description,
		orderIndex: body.orderIndex ?? 0,
		isActive: body.isActive ?? true,
		era: body.era,
		exceptions: body.exceptions
	}).returning();
	return json(newRule, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(soundChanges)
		.set({
			name: body.name,
			fromPattern: body.fromPattern,
			toPattern: body.toPattern,
			environment: body.environment,
			description: body.description,
			orderIndex: body.orderIndex,
			isActive: body.isActive,
			era: body.era,
			exceptions: body.exceptions
		})
		.where(eq(soundChanges.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Sound change not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(soundChanges)
		.where(eq(soundChanges.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Sound change not found');
	return json({ success: true });
};
