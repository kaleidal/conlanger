import { writable } from 'svelte/store';

function createHelpStore() {
	const { subscribe, set, update } = writable(false);
	
	return {
		subscribe,
		toggle: () => update(v => !v),
		enable: () => set(true),
		disable: () => set(false)
	};
}

export const helpMode = createHelpStore();

export const helpTexts: Record<string, { title: string; description: string }> = {
	phonemes: {
		title: 'Phonemes',
		description: 'Phonemes are the distinct sounds in your language. Each phoneme represents a sound that can change the meaning of a word. For example, /p/ and /b/ are different phonemes in English because "pat" and "bat" mean different things.'
	},
	consonants: {
		title: 'Consonants',
		description: 'Consonants are sounds made by obstructing airflow. They are organized by place of articulation (where in the mouth) and manner (how the obstruction happens). Click any IPA symbol to add it to your language.'
	},
	vowels: {
		title: 'Vowels',
		description: 'Vowels are sounds made with an open vocal tract. They are organized by height (how open the mouth is), backness (tongue position), and roundedness (lip shape).'
	},
	allophones: {
		title: 'Allophones',
		description: 'Allophones are variant pronunciations of a phoneme that occur in specific environments. For example, in English, the /p/ in "pin" is aspirated [pʰ] but in "spin" it\'s not. They\'re the same phoneme with different realizations.'
	},
	phonotactics: {
		title: 'Phonotactics',
		description: 'Phonotactics are the rules for how sounds can combine. This includes syllable structure (like CVC = consonant-vowel-consonant) and which sounds can appear next to each other.'
	},
	soundChanges: {
		title: 'Sound Changes',
		description: 'Sound changes are rules for how sounds transform in certain contexts. They use patterns like "a > e / _i" meaning "a becomes e when followed by i". This is how languages evolve over time.'
	},
	morphemes: {
		title: 'Morphemes',
		description: 'Morphemes are the smallest meaningful units. They include roots (like "walk") and affixes (like "-ing" or "un-"). Prefixes attach before, suffixes after, infixes inside, and circumfixes wrap around.'
	},
	grammarCategories: {
		title: 'Grammar Categories',
		description: 'Grammar categories are features like tense (past/present/future), number (singular/plural), case (nominative/accusative), or gender. Define what categories your language uses and their possible values.'
	},
	inflectionClasses: {
		title: 'Inflection Classes',
		description: 'Inflection classes group words that follow the same pattern. For example, in Latin, different noun "declensions" have different endings. Define patterns for how words in each class change.'
	},
	wordOrder: {
		title: 'Word Order',
		description: 'Word order defines the typical arrangement of Subject (S), Verb (V), and Object (O). English is SVO ("I eat apples"), Japanese is SOV ("I apples eat"), Irish is VSO ("Eat I apples").'
	},
	syntaxRules: {
		title: 'Syntax Rules',
		description: 'Syntax rules define how phrases and sentences are structured. This includes things like adjective placement, question formation, and how clauses combine.'
	},
	lexicon: {
		title: 'Lexicon',
		description: 'The lexicon is your language\'s vocabulary. Each word has a form (spelling), pronunciation (IPA), part of speech, and meaning. You can also track etymology (word origins) and semantic relations.'
	},
	scripts: {
		title: 'Writing Systems',
		description: 'Scripts define how your language is written. You can create alphabets (one symbol per sound), syllabaries (one symbol per syllable), or logographic systems (symbols for words/concepts).'
	},
	glyphs: {
		title: 'Glyphs',
		description: 'Glyphs are the individual symbols in your writing system. Each glyph has a shape and represents either a sound, syllable, or meaning depending on your script type.'
	},
	texts: {
		title: 'Texts',
		description: 'Texts are samples of your language in use. You can create translations, original compositions, or example sentences. The interlinear gloss shows word-by-word breakdowns.'
	},
	interlinear: {
		title: 'Interlinear Gloss',
		description: 'Interlinear glossing shows each word broken down with its morphemes, glosses (meanings), and a free translation. It\'s the standard way linguists annotate language samples.'
	},
	wordGenerator: {
		title: 'Word Generator',
		description: 'Generates random words following your phonotactic rules. Great for quickly building vocabulary that sounds consistent with your language\'s sound patterns.'
	},
	minimalPairs: {
		title: 'Minimal Pairs',
		description: 'Minimal pairs are words that differ by only one sound, proving those sounds are distinct phonemes. For example, "bat" and "pat" show /b/ and /p/ are separate phonemes in English.'
	},
	paradigmGenerator: {
		title: 'Paradigm Generator',
		description: 'Generates full conjugation or declension tables showing all forms of a word. Enter a root and see how it changes across all your grammar categories.'
	},
	categoryName: {
		title: 'Category Name',
		description: 'The name of this grammatical feature. Examples: "Number" (for singular/plural), "Case" (for nominative/accusative/etc), "Tense" (for past/present/future), "Gender" (for masculine/feminine/neuter).'
	},
	categoryAbbreviation: {
		title: 'Abbreviation',
		description: 'A short code used in glosses. Examples: NUM for Number, CASE for Case, TNS for Tense. This appears in interlinear glosses.'
	},
	categoryAppliesTo: {
		title: 'Applies To',
		description: 'Which word classes use this category. For example, "Number" might apply to nouns, pronouns, and verbs (for agreement). "Tense" typically only applies to verbs.'
	},
	categoryValues: {
		title: 'Values',
		description: 'The possible values for this category. Format: Name:ABBREVIATION. For Number: "singular:SG" and "plural:PL". For Case: "nominative:NOM", "accusative:ACC", "genitive:GEN", etc.'
	},
	morphemeForm: {
		title: 'Morpheme Form',
		description: 'The actual shape of the morpheme. Use hyphens to show where it attaches: "-s" (suffix), "un-" (prefix), "-um-" (infix). For circumfixes use: "ge-...-t" format.'
	},
	morphemeType: {
		title: 'Morpheme Type',
		description: 'Prefix: attaches before (un-happy). Suffix: attaches after (walk-ed). Infix: inserts inside (Tagalog: sulat → s-um-ulat). Circumfix: wraps around (German: ge-mach-t).'
	},
	morphemeGloss: {
		title: 'Gloss',
		description: 'Standard abbreviation for what this morpheme means. Common ones: PL (plural), SG (singular), PAST, PRES (present), 1/2/3 (person), NOM (nominative), ACC (accusative), NEG (negation).'
	},
	morphemeCondition: {
		title: 'Phonological Condition',
		description: 'When does this form appear? Examples: "after vowels", "before voiceless consonants", "in stressed syllables". Leave blank if it always applies.'
	},
	morphemeAllomorphs: {
		title: 'Allomorphs',
		description: 'Different forms of the same morpheme. English plural has: "-s" (cats), "-es" (boxes), "-en" (oxen). Format each as "form:condition". Example: "-es:after sibilants".'
	},
	morphemeGrammaticalMeaning: {
		title: 'Grammatical Meaning',
		description: 'What grammatical features this morpheme expresses. Format: "category:value". Example: "number:plural" or "tense:past". A morpheme can express multiple features.'
	},
	inflectionClassName: {
		title: 'Class Name',
		description: 'A name for this inflection pattern. Examples: "1st Declension", "Strong Verbs", "A-stems", "Regular -ar verbs". Words in the same class follow the same pattern.'
	},
	inflectionClassWordClass: {
		title: 'Word Class',
		description: 'What type of word this class applies to. Declensions are for nouns, conjugations are for verbs. Adjectives might have their own patterns too.'
	},
	inflectionClassParadigm: {
		title: 'Paradigm',
		description: 'Define all the forms in this pattern. Format: "feature1=value1,feature2=value2:ending". Example for Latin: "case=nom,number=sg:-us" means nominative singular ends in -us.'
	},
	phonemeSymbol: {
		title: 'IPA Symbol',
		description: 'The IPA (International Phonetic Alphabet) representation of this sound. This is how linguists write the sound. Click buttons on the IPA keyboard below to insert symbols.'
	},
	phonemeRomanization: {
		title: 'Romanization',
		description: 'How this sound is written in your language\'s Latin script orthography. For example, /ʃ/ might be romanized as "sh" in English or "sch" in German.'
	},
	allophonePhoneme: {
		title: 'Parent Phoneme',
		description: 'The phoneme this allophone is a variant of. Allophones are predictable variations of a phoneme that occur in specific environments.'
	},
	allophoneEnvironment: {
		title: 'Environment',
		description: 'The phonological context where this allophone appears. Use _ for the sound position, # for word boundary. Example: "#_" means word-initially, "V_V" means between vowels.'
	},
	phonotacticPattern: {
		title: 'Pattern',
		description: 'A template showing allowed sound sequences. C=consonant, V=vowel, (X)=optional. Example: "(C)(C)V(C)" allows syllables like CV, CCV, CVC, CCVC.'
	},
	phonotacticPosition: {
		title: 'Syllable Position',
		description: 'Where in the syllable this rule applies. Onset=beginning, Nucleus=vowel center, Coda=ending. Leave as "Any" if it applies to the whole syllable.'
	},
	soundChangeFrom: {
		title: 'From Pattern',
		description: 'The sound or pattern that changes. Can be a single sound like "p" or a class like "P" (any plosive). Use feature classes for broader rules.'
	},
	soundChangeTo: {
		title: 'To Pattern',
		description: 'What the sound becomes. Use the empty symbol "∅" (or leave blank) for deletion. The replacement can include features from the original.'
	},
	soundChangeEnvironment: {
		title: 'Environment',
		description: 'Where the change occurs. Format: "X_Y" where _ is the changing sound, X is what precedes, Y is what follows. Examples: "V_V" (between vowels), "#_" (word-initial), "_#" (word-final).'
	},
	soundChangeEra: {
		title: 'Era/Period',
		description: 'When in your language\'s history this change occurred. Useful for organizing changes chronologically: "Proto-Language", "Early", "Classical", "Modern", etc.'
	},
	wordLemma: {
		title: 'Lemma',
		description: 'The citation form or dictionary form of the word. For verbs this is usually the infinitive, for nouns the singular nominative. This is how the word appears in dictionaries.'
	},
	wordIPA: {
		title: 'IPA Pronunciation',
		description: 'How the word is pronounced in IPA (International Phonetic Alphabet). This should reflect the actual phonetic realization, not just the phonemes.'
	},
	wordDefinitions: {
		title: 'Definitions',
		description: 'The meanings of this word. Enter one meaning per line. The first definition is considered the primary meaning.'
	},
	wordMorphology: {
		title: 'Morphological Analysis',
		description: 'How the word breaks down into morphemes. Use Leipzig glossing conventions: hyphens separate morphemes, dots separate fused meanings. Example: "walk-ed" or "1SG.PAST".'
	},
	wordEtymology: {
		title: 'Etymology',
		description: 'The origin and history of the word. Where did it come from? Was it borrowed? Derived from another word? This helps track vocabulary development.'
	},
	wordRelationType: {
		title: 'Relationship Type',
		description: 'How two words are related. Synonym (same meaning), Antonym (opposite), Hypernym (more general, e.g. animal→dog), Hyponym (more specific), Derived (formed from).'
	},
	syntaxPattern: {
		title: 'Pattern',
		description: 'The structural rule in phrase structure notation. Example: "S → NP VP" means a sentence consists of a noun phrase followed by a verb phrase.'
	},
	syntaxOutput: {
		title: 'Output',
		description: 'For transformation rules, what the pattern becomes after the rule applies. Used for movement rules or reordering operations.'
	},
	scriptType: {
		title: 'Script Type',
		description: 'Alphabet: letters for consonants and vowels. Abjad: consonants only (like Arabic). Abugida: consonant+vowel units (like Devanagari). Syllabary: syllable symbols (like Japanese kana).'
	},
	scriptDirection: {
		title: 'Writing Direction',
		description: 'The direction text flows. LTR (left-to-right, like Latin), RTL (right-to-left, like Arabic/Hebrew), TTB (top-to-bottom, like traditional Chinese).'
	},
	glyphCharacter: {
		title: 'Character',
		description: 'The actual glyph symbol. This can be a Unicode character from an existing script, a Private Use Area character, or left blank if using SVG.'
	},
	glyphPhoneme: {
		title: 'Phoneme Mapping',
		description: 'What sound(s) this glyph represents. For alphabets, usually a single phoneme. For syllabaries, a syllable like "ka". For logographic scripts, this might be blank.'
	},
	romanNative: {
		title: 'Native Form',
		description: 'The character(s) in your conlang\'s script. These will be matched and replaced according to the rule when romanizing text.'
	},
	romanLatin: {
		title: 'Romanized Form',
		description: 'The Latin script equivalent. This is what the native form will be converted to. Common conventions include digraphs like "sh" or diacritics like "á".'
	},
	textTitle: {
		title: 'Text Title',
		description: 'A name for this text sample. Examples: "The North Wind and the Sun", "Creation Myth", "Greeting Dialogue", "Sample Sentences".'
	},
	textSource: {
		title: 'Source',
		description: 'Where this text comes from or what inspired it. Examples: "Aesop\'s Fables", "Original composition", "Translation exercise", "Swadesh list sentences".'
	},
	textOriginal: {
		title: 'Original Text',
		description: 'The text written in your conlang. This is the main content you\'re documenting or translating into your language.'
	},
	textTranslation: {
		title: 'Translation',
		description: 'A natural translation into English (or another language). This should read naturally, not as a word-for-word gloss.'
	},
	textNotes: {
		title: 'Notes',
		description: 'Any additional context, grammatical notes, or explanations about this text. Useful for documenting interesting constructions or translation choices.'
	},
	ilMorphemes: {
		title: 'Morphemes',
		description: 'Enter each word/morpheme as "surface:gloss" separated by spaces. Use Leipzig conventions for glosses (PL, SG, NOM, etc.). Example: "talo-ssa:house-INE asu-u:live-3SG".'
	},
	ilTranslation: {
		title: 'Free Translation',
		description: 'A natural translation of this line. Unlike the morpheme glosses, this should read as normal prose.'
	},
	generatorMinSyllables: {
		title: 'Min Syllables',
		description: 'The minimum number of syllables for generated words. Set lower for shorter, simpler words.'
	},
	generatorMaxSyllables: {
		title: 'Max Syllables',
		description: 'The maximum number of syllables for generated words. Longer words may be harder to pronounce but can be more distinctive.'
	},
	generatorCount: {
		title: 'Words to Generate',
		description: 'How many candidate words to create. Generate more to have a larger pool to choose from.'
	},
	generatorStructures: {
		title: 'Syllable Structures',
		description: 'Patterns for syllable shapes. C=consonant, V=vowel. Common patterns: CV (open syllable), CVC (closed syllable), CCVC (consonant cluster onset). Separate multiple patterns with commas.'
	},
	paradigmWord: {
		title: 'Word/Stem',
		description: 'The base form to generate inflections for. Enter the stem (root form) that will receive affixes according to the inflection class.'
	},
	paradigmClass: {
		title: 'Inflection Class',
		description: 'Which pattern of inflections to apply. Each class defines a set of endings or changes for different grammatical forms.'
	},
	probWord: {
		title: 'Word to Analyze',
		description: 'Enter a word (in IPA or romanization) to calculate how "natural" it sounds based on phoneme frequencies in your existing lexicon.'
	}
};
