import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { languages } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const allLanguages = await db.select().from(languages).orderBy(languages.name);
	return json(allLanguages);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const [newLanguage] = await db.insert(languages).values({
		name: body.name,
		nativeName: body.nativeName,
		description: body.description,
		isoCode: body.isoCode,
		parentLanguageId: body.parentLanguageId,
		settings: body.settings
	}).returning();
	return json(newLanguage, { status: 201 });
};
