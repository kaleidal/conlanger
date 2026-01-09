import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { syntaxRules } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(syntaxRules)
		.where(eq(syntaxRules.languageId, params.id))
		.orderBy(syntaxRules.orderIndex);
	return json(result);
};

export const POST: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [newRule] = await db.insert(syntaxRules).values({
		languageId: params.id,
		name: body.name,
		ruleType: body.ruleType,
		pattern: body.pattern,
		output: body.output,
		conditions: body.conditions,
		description: body.description,
		examples: body.examples,
		orderIndex: body.orderIndex ?? 0
	}).returning();
	return json(newRule, { status: 201 });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const [updated] = await db.update(syntaxRules)
		.set({
			name: body.name,
			ruleType: body.ruleType,
			pattern: body.pattern,
			output: body.output,
			conditions: body.conditions,
			description: body.description,
			examples: body.examples,
			orderIndex: body.orderIndex
		})
		.where(eq(syntaxRules.id, body.id))
		.returning();
	
	if (!updated) throw error(404, 'Syntax rule not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [deleted] = await db.delete(syntaxRules)
		.where(eq(syntaxRules.id, body.id))
		.returning();
	if (!deleted) throw error(404, 'Syntax rule not found');
	return json({ success: true });
};
