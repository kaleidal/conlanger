import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Custom validators for complex types
const phonemeFeatures = v.object({
  manner: v.optional(v.string()),
  place: v.optional(v.string()),
  voicing: v.optional(v.string()),
  height: v.optional(v.string()),
  backness: v.optional(v.string()),
  roundedness: v.optional(v.string()),
  length: v.optional(v.string()),
  nasalization: v.optional(v.boolean()),
  aspiration: v.optional(v.boolean()),
  palatalization: v.optional(v.boolean()),
  labialization: v.optional(v.boolean()),
  pharyngealization: v.optional(v.boolean()),
  glottalization: v.optional(v.boolean()),
  tone: v.optional(v.string()),
});

const toneDefinition = v.object({
  name: v.string(),
  contour: v.string(),
  diacritic: v.optional(v.string()),
  number: v.optional(v.number()),
});

const toneSystem = v.object({
  hasTone: v.boolean(),
  toneCount: v.optional(v.number()),
  toneMarking: v.optional(v.string()),
  tones: v.optional(v.array(toneDefinition)),
});

const languageSettings = v.object({
  wordOrder: v.optional(v.string()),
  headDirection: v.optional(v.string()),
  morphologicalType: v.optional(v.string()),
  alignment: v.optional(v.string()),
  defaultScript: v.optional(v.string()),
  stressPattern: v.optional(v.string()),
  toneSystem: v.optional(toneSystem),
});

const grammarValue = v.object({
  name: v.string(),
  abbreviation: v.string(),
  description: v.optional(v.string()),
});

const allomorph = v.object({
  form: v.string(),
  condition: v.string(),
  description: v.optional(v.string()),
});

const paradigmCell = v.object({
  features: v.any(), // Record<string, string>
  form: v.string(),
  isRegular: v.boolean(),
});

const syntaxCondition = v.object({
  type: v.string(),
  value: v.string(),
  operator: v.optional(v.string()),
});

const syntaxExample = v.object({
  input: v.string(),
  output: v.string(),
  gloss: v.optional(v.string()),
  translation: v.optional(v.string()),
});

const definition = v.object({
  meaning: v.string(),
  partOfSpeech: v.optional(v.string()),
  examples: v.optional(v.array(v.string())),
  register: v.optional(v.string()),
  domain: v.optional(v.string()),
});

const cognateInfo = v.object({
  language: v.string(),
  form: v.string(),
  meaning: v.optional(v.string()),
});

const etymology = v.object({
  origin: v.optional(v.string()),
  protoForm: v.optional(v.string()),
  borrowedFrom: v.optional(v.string()),
  cognates: v.optional(v.array(cognateInfo)),
  soundChanges: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
});

const scriptSettings = v.object({
  fontSize: v.optional(v.number()),
  lineHeight: v.optional(v.number()),
  letterSpacing: v.optional(v.number()),
  customFont: v.optional(v.string()),
});

const glyphVariant = v.object({
  position: v.string(),
  form: v.string(),
  svgPath: v.optional(v.string()),
});

const interlinearMorpheme = v.object({
  surface: v.string(),
  underlying: v.optional(v.string()),
  gloss: v.string(),
  wordId: v.optional(v.string()),
});

const interlinearData = v.object({
  morphemes: v.array(interlinearMorpheme),
  translation: v.string(),
});

// Enums as union types
const phonemeType = v.union(v.literal("consonant"), v.literal("vowel"));
const affixType = v.union(
  v.literal("prefix"),
  v.literal("suffix"),
  v.literal("infix"),
  v.literal("circumfix"),
  v.literal("interfix"),
  v.literal("suprafix"),
  v.literal("transfix")
);
const wordClass = v.union(
  v.literal("noun"),
  v.literal("verb"),
  v.literal("adjective"),
  v.literal("adverb"),
  v.literal("pronoun"),
  v.literal("determiner"),
  v.literal("preposition"),
  v.literal("postposition"),
  v.literal("conjunction"),
  v.literal("interjection"),
  v.literal("particle"),
  v.literal("numeral"),
  v.literal("classifier"),
  v.literal("auxiliary"),
  v.literal("copula"),
  v.literal("other")
);
const scriptType = v.union(
  v.literal("alphabet"),
  v.literal("abjad"),
  v.literal("abugida"),
  v.literal("syllabary"),
  v.literal("logographic"),
  v.literal("featural"),
  v.literal("mixed")
);
const wordRelationType = v.union(
  v.literal("synonym"),
  v.literal("antonym"),
  v.literal("hypernym"),
  v.literal("hyponym"),
  v.literal("meronym"),
  v.literal("holonym"),
  v.literal("derived"),
  v.literal("compound"),
  v.literal("cognate"),
  v.literal("doublet")
);

export default defineSchema({
  // Users table for Ave authentication
  users: defineTable({
    aveId: v.string(), // Ave identity ID
    handle: v.string(),
    displayName: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ave_id", ["aveId"])
    .index("by_handle", ["handle"]),

  // Sessions for auth tokens
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Languages - now with owner
  languages: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    nativeName: v.optional(v.string()),
    description: v.optional(v.string()),
    isoCode: v.optional(v.string()),
    parentLanguageId: v.optional(v.id("languages")),
    settings: v.optional(languageSettings),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_public", ["isPublic"]),

  // Collaborators for shared editing
  collaborators: defineTable({
    languageId: v.id("languages"),
    userId: v.id("users"),
    role: v.union(v.literal("editor"), v.literal("viewer")),
    addedAt: v.number(),
  })
    .index("by_language", ["languageId"])
    .index("by_user", ["userId"])
    .index("by_language_user", ["languageId", "userId"]),

  // Presence for real-time collaboration
  presence: defineTable({
    languageId: v.id("languages"),
    userId: v.id("users"),
    sessionId: v.string(),
    currentPage: v.string(),
    currentElement: v.optional(v.string()),
    cursorPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
    lastSeen: v.number(),
    color: v.string(),
  })
    .index("by_language", ["languageId"])
    .index("by_session", ["sessionId"])
    .index("by_language_user", ["languageId", "userId"]),

  // Phonemes
  phonemes: defineTable({
    languageId: v.id("languages"),
    symbol: v.string(),
    type: phonemeType,
    ipa: v.string(),
    romanization: v.optional(v.string()),
    features: v.optional(phonemeFeatures),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_language", ["languageId"]),

  // Allophones
  allophones: defineTable({
    languageId: v.id("languages"),
    phonemeId: v.id("phonemes"),
    symbol: v.string(),
    ipa: v.string(),
    environment: v.string(),
    environmentDescription: v.optional(v.string()),
    features: v.optional(phonemeFeatures),
  })
    .index("by_language", ["languageId"])
    .index("by_phoneme", ["phonemeId"]),

  // Phonotactics
  phonotactics: defineTable({
    languageId: v.id("languages"),
    name: v.string(),
    pattern: v.string(),
    description: v.optional(v.string()),
    syllablePosition: v.optional(v.string()),
    isRequired: v.boolean(),
    examples: v.optional(v.array(v.string())),
  }).index("by_language", ["languageId"]),

  // Sound Changes
  soundChanges: defineTable({
    languageId: v.id("languages"),
    name: v.string(),
    fromPattern: v.string(),
    toPattern: v.string(),
    environment: v.optional(v.string()),
    description: v.optional(v.string()),
    orderIndex: v.number(),
    isActive: v.boolean(),
    era: v.optional(v.string()),
    exceptions: v.optional(v.array(v.string())),
  }).index("by_language", ["languageId"]),

  // Grammar Categories
  grammarCategories: defineTable({
    languageId: v.id("languages"),
    name: v.string(),
    abbreviation: v.optional(v.string()),
    description: v.optional(v.string()),
    values: v.optional(v.array(grammarValue)),
    appliesTo: v.optional(v.array(v.string())),
  }).index("by_language", ["languageId"]),

  // Morphemes
  morphemes: defineTable({
    languageId: v.id("languages"),
    form: v.string(),
    gloss: v.string(),
    type: affixType,
    allomorphs: v.optional(v.array(allomorph)),
    grammaticalMeaning: v.optional(v.any()), // Record<string, string>
    phonologicalCondition: v.optional(v.string()),
    description: v.optional(v.string()),
  }).index("by_language", ["languageId"]),

  // Inflection Classes
  inflectionClasses: defineTable({
    languageId: v.id("languages"),
    name: v.string(),
    wordClass: wordClass,
    description: v.optional(v.string()),
    paradigm: v.optional(v.array(paradigmCell)),
  }).index("by_language", ["languageId"]),

  // Syntax Rules
  syntaxRules: defineTable({
    languageId: v.id("languages"),
    name: v.string(),
    ruleType: v.string(),
    pattern: v.string(),
    output: v.optional(v.string()),
    conditions: v.optional(v.array(syntaxCondition)),
    description: v.optional(v.string()),
    examples: v.optional(v.array(syntaxExample)),
    orderIndex: v.number(),
  }).index("by_language", ["languageId"]),

  // Words
  words: defineTable({
    languageId: v.id("languages"),
    lemma: v.string(),
    ipa: v.optional(v.string()),
    romanization: v.optional(v.string()),
    wordClass: wordClass,
    inflectionClassId: v.optional(v.id("inflectionClasses")),
    definitions: v.optional(v.array(definition)),
    etymology: v.optional(etymology),
    morphologicalAnalysis: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    semanticFields: v.optional(v.array(v.string())),
    usageNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_language", ["languageId"])
    .index("by_lemma", ["languageId", "lemma"])
    .searchIndex("search_words", {
      searchField: "lemma",
      filterFields: ["languageId"],
    }),

  // Inflected Forms
  inflectedForms: defineTable({
    wordId: v.id("words"),
    form: v.string(),
    ipa: v.optional(v.string()),
    grammaticalFeatures: v.optional(v.any()), // Record<string, string>
    isIrregular: v.boolean(),
  }).index("by_word", ["wordId"]),

  // Word Relationships
  wordRelationships: defineTable({
    fromWordId: v.id("words"),
    toWordId: v.id("words"),
    relationType: wordRelationType,
    notes: v.optional(v.string()),
  })
    .index("by_from_word", ["fromWordId"])
    .index("by_to_word", ["toWordId"]),

  // Scripts
  scripts: defineTable({
    languageId: v.id("languages"),
    name: v.string(),
    type: scriptType,
    description: v.optional(v.string()),
    direction: v.string(),
    baselinePosition: v.optional(v.string()),
    settings: v.optional(scriptSettings),
  }).index("by_language", ["languageId"]),

  // Glyphs
  glyphs: defineTable({
    scriptId: v.id("scripts"),
    character: v.optional(v.string()),
    svgPath: v.optional(v.string()),
    unicodePoint: v.optional(v.string()),
    phonemeMapping: v.optional(v.string()),
    name: v.optional(v.string()),
    variants: v.optional(v.array(glyphVariant)),
    sortOrder: v.number(),
  }).index("by_script", ["scriptId"]),

  // Romanization Rules
  romanizationRules: defineTable({
    scriptId: v.id("scripts"),
    nativeForm: v.string(),
    romanizedForm: v.string(),
    environment: v.optional(v.string()),
    priority: v.number(),
  }).index("by_script", ["scriptId"]),

  // Texts
  texts: defineTable({
    languageId: v.id("languages"),
    title: v.string(),
    originalText: v.optional(v.string()),
    translatedText: v.optional(v.string()),
    interlinearData: v.optional(v.array(interlinearData)),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_language", ["languageId"]),

  // Activity log for collaboration
  activityLog: defineTable({
    languageId: v.id("languages"),
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_language", ["languageId"])
    .index("by_user", ["userId"])
    .index("by_language_time", ["languageId", "timestamp"]),
});
