import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { languages, phonemes, allophones, phonotactics, soundChanges, morphemes, grammarCategories, inflectionClasses, syntaxRules, words, scripts, glyphs, romanizationRules, texts } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { ExportEngine, type LanguageExport, type PhonemeExport, type AllophoneExport, type PhonotacticExport, type SoundChangeExport, type MorphemeExport, type GrammarCategoryExport, type InflectionClassExport, type SyntaxRuleExport, type WordExport, type ScriptExport, type TextExport } from '$lib/engines/export';

export const GET: RequestHandler = async ({ params, url }) => {
	const format = url.searchParams.get('format') ?? 'json';
	
	const [language] = await db.select().from(languages).where(eq(languages.id, params.id));
	if (!language) throw error(404, 'Language not found');
	
	const [
		languagePhonemes,
		languageAllophones,
		languagePhonotactics,
		languageSoundChanges,
		languageMorphemes,
		languageGrammarCategories,
		languageInflectionClasses,
		languageSyntaxRules,
		languageWords,
		languageScripts,
		languageTexts
	] = await Promise.all([
		db.select().from(phonemes).where(eq(phonemes.languageId, params.id)),
		db.select().from(allophones).where(eq(allophones.languageId, params.id)),
		db.select().from(phonotactics).where(eq(phonotactics.languageId, params.id)),
		db.select().from(soundChanges).where(eq(soundChanges.languageId, params.id)),
		db.select().from(morphemes).where(eq(morphemes.languageId, params.id)),
		db.select().from(grammarCategories).where(eq(grammarCategories.languageId, params.id)),
		db.select().from(inflectionClasses).where(eq(inflectionClasses.languageId, params.id)),
		db.select().from(syntaxRules).where(eq(syntaxRules.languageId, params.id)),
		db.select().from(words).where(eq(words.languageId, params.id)),
		db.select().from(scripts).where(eq(scripts.languageId, params.id)),
		db.select().from(texts).where(eq(texts.languageId, params.id))
	]);
	
	const scriptIds = languageScripts.map(s => s.id);
	const [allGlyphs, allRomanization] = await Promise.all([
		scriptIds.length > 0 
			? Promise.all(scriptIds.map(id => db.select().from(glyphs).where(eq(glyphs.scriptId, id))))
			: [],
		scriptIds.length > 0
			? Promise.all(scriptIds.map(id => db.select().from(romanizationRules).where(eq(romanizationRules.scriptId, id))))
			: []
	]);
	
	const glyphsByScript = new Map<string, typeof allGlyphs[0]>();
	const romanizationByScript = new Map<string, typeof allRomanization[0]>();
	scriptIds.forEach((id, i) => {
		glyphsByScript.set(id, allGlyphs[i] ?? []);
		romanizationByScript.set(id, allRomanization[i] ?? []);
	});
	
	const phonemeMap = new Map(languagePhonemes.map(p => [p.id, p.symbol]));
	
	const exportData: LanguageExport = {
		name: language.name,
		nativeName: language.nativeName ?? undefined,
		description: language.description ?? undefined,
		settings: language.settings as Record<string, unknown> | undefined,
		phonology: {
			phonemes: languagePhonemes.map((p): PhonemeExport => ({
				symbol: p.symbol,
				type: p.type as 'consonant' | 'vowel',
				ipa: p.ipa,
				romanization: p.romanization ?? undefined,
				features: p.features as Record<string, unknown> | undefined,
				description: p.description ?? undefined
			})),
			allophones: languageAllophones.map((a): AllophoneExport => ({
				phonemeSymbol: phonemeMap.get(a.phonemeId) ?? '',
				symbol: a.symbol,
				ipa: a.ipa,
				environment: a.environment,
				environmentDescription: a.environmentDescription ?? undefined
			})),
			phonotactics: languagePhonotactics.map((p): PhonotacticExport => ({
				name: p.name,
				pattern: p.pattern,
				description: p.description ?? undefined,
				syllablePosition: p.syllablePosition ?? undefined,
				examples: p.examples as string[] | undefined
			})),
			soundChanges: languageSoundChanges.map((s): SoundChangeExport => ({
				name: s.name,
				fromPattern: s.fromPattern,
				toPattern: s.toPattern,
				environment: s.environment ?? undefined,
				description: s.description ?? undefined,
				orderIndex: s.orderIndex ?? 0,
				era: s.era ?? undefined
			}))
		},
		morphology: {
			morphemes: languageMorphemes.map((m): MorphemeExport => ({
				form: m.form,
				gloss: m.gloss,
				type: m.type,
				allomorphs: m.allomorphs as { form: string; condition: string }[] | undefined,
				grammaticalMeaning: m.grammaticalMeaning as Record<string, string> | undefined,
				description: m.description ?? undefined
			})),
			grammarCategories: languageGrammarCategories.map((g): GrammarCategoryExport => ({
				name: g.name,
				abbreviation: g.abbreviation ?? undefined,
				values: g.values as { name: string; abbreviation: string }[],
				appliesTo: g.appliesTo as string[] | undefined
			})),
			inflectionClasses: languageInflectionClasses.map((i): InflectionClassExport => ({
				name: i.name,
				wordClass: i.wordClass,
				paradigm: i.paradigm as { features: Record<string, string>; form: string }[]
			}))
		},
		syntax: {
			rules: languageSyntaxRules.map((r): SyntaxRuleExport => ({
				name: r.name,
				ruleType: r.ruleType,
				pattern: r.pattern,
				output: r.output ?? undefined,
				description: r.description ?? undefined,
				examples: r.examples as { input: string; output: string; gloss?: string; translation?: string }[] | undefined
			})),
			settings: language.settings as Record<string, unknown> | undefined
		},
		lexicon: {
			words: languageWords.map((w): WordExport => ({
				lemma: w.lemma,
				ipa: w.ipa ?? undefined,
				romanization: w.romanization ?? undefined,
				wordClass: w.wordClass,
				inflectionClass: undefined,
				definitions: w.definitions as { meaning: string; examples?: string[] }[] ?? [],
				etymology: w.etymology as { origin?: string; protoForm?: string; borrowedFrom?: string } | undefined,
				morphologicalAnalysis: w.morphologicalAnalysis ?? undefined,
				tags: w.tags as string[] | undefined,
				semanticFields: w.semanticFields as string[] | undefined
			}))
		},
		scripts: languageScripts.map((s): ScriptExport => ({
			name: s.name,
			type: s.type,
			direction: s.direction ?? 'ltr',
			glyphs: (glyphsByScript.get(s.id) ?? []).map(g => ({
				character: g.character ?? undefined,
				svgPath: g.svgPath ?? undefined,
				phonemeMapping: g.phonemeMapping ?? undefined,
				name: g.name ?? undefined
			})),
			romanizationRules: (romanizationByScript.get(s.id) ?? []).map(r => ({
				nativeForm: r.nativeForm,
				romanizedForm: r.romanizedForm,
				environment: r.environment ?? undefined
			}))
		})),
		texts: languageTexts.map((t): TextExport => ({
			title: t.title,
			originalText: t.originalText ?? undefined,
			translatedText: t.translatedText ?? undefined,
			interlinearData: t.interlinearData as unknown[] | undefined,
			notes: t.notes ?? undefined,
			source: t.source ?? undefined
		}))
	};
	
	const filename = `${language.name.toLowerCase().replace(/\s+/g, '-')}`;
	
	switch (format) {
		case 'json': {
			const content = ExportEngine.exportToJson(exportData);
			return new Response(content, {
				headers: {
					'Content-Type': 'application/json',
					'Content-Disposition': `attachment; filename="${filename}.json"`
				}
			});
		}
		
		case 'latex': {
			const content = ExportEngine.exportToLatex(exportData);
			return new Response(content, {
				headers: {
					'Content-Type': 'application/x-latex',
					'Content-Disposition': `attachment; filename="${filename}.tex"`
				}
			});
		}
		
		case 'markdown': {
			const content = ExportEngine.exportToMarkdown(exportData);
			return new Response(content, {
				headers: {
					'Content-Type': 'text/markdown',
					'Content-Disposition': `attachment; filename="${filename}.md"`
				}
			});
		}
		
		case 'csv': {
			const content = ExportEngine.exportLexiconToCsv(exportData.lexicon.words);
			return new Response(content, {
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename="${filename}-lexicon.csv"`
				}
			});
		}
		
		default:
			throw error(400, `Unsupported format: ${format}. Supported formats: json, latex, markdown, csv`);
	}
};
