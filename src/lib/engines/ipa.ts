export const IPA_CONSONANTS: IPASound[] = [
	{ symbol: 'p', features: { manner: 'plosive', place: 'bilabial', voicing: 'voiceless' } },
	{ symbol: 'b', features: { manner: 'plosive', place: 'bilabial', voicing: 'voiced' } },
	{ symbol: 't', features: { manner: 'plosive', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 'd', features: { manner: 'plosive', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ʈ', features: { manner: 'plosive', place: 'retroflex', voicing: 'voiceless' } },
	{ symbol: 'ɖ', features: { manner: 'plosive', place: 'retroflex', voicing: 'voiced' } },
	{ symbol: 'c', features: { manner: 'plosive', place: 'palatal', voicing: 'voiceless' } },
	{ symbol: 'ɟ', features: { manner: 'plosive', place: 'palatal', voicing: 'voiced' } },
	{ symbol: 'k', features: { manner: 'plosive', place: 'velar', voicing: 'voiceless' } },
	{ symbol: 'g', features: { manner: 'plosive', place: 'velar', voicing: 'voiced' } },
	{ symbol: 'q', features: { manner: 'plosive', place: 'uvular', voicing: 'voiceless' } },
	{ symbol: 'ɢ', features: { manner: 'plosive', place: 'uvular', voicing: 'voiced' } },
	{ symbol: 'ʔ', features: { manner: 'plosive', place: 'glottal', voicing: 'voiceless' } },
	{ symbol: 'm', features: { manner: 'nasal', place: 'bilabial', voicing: 'voiced' } },
	{ symbol: 'ɱ', features: { manner: 'nasal', place: 'labiodental', voicing: 'voiced' } },
	{ symbol: 'n', features: { manner: 'nasal', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ɳ', features: { manner: 'nasal', place: 'retroflex', voicing: 'voiced' } },
	{ symbol: 'ɲ', features: { manner: 'nasal', place: 'palatal', voicing: 'voiced' } },
	{ symbol: 'ŋ', features: { manner: 'nasal', place: 'velar', voicing: 'voiced' } },
	{ symbol: 'ɴ', features: { manner: 'nasal', place: 'uvular', voicing: 'voiced' } },
	{ symbol: 'ʙ', features: { manner: 'trill', place: 'bilabial', voicing: 'voiced' } },
	{ symbol: 'r', features: { manner: 'trill', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ʀ', features: { manner: 'trill', place: 'uvular', voicing: 'voiced' } },
	{ symbol: 'ⱱ', features: { manner: 'tap', place: 'labiodental', voicing: 'voiced' } },
	{ symbol: 'ɾ', features: { manner: 'tap', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ɽ', features: { manner: 'tap', place: 'retroflex', voicing: 'voiced' } },
	{ symbol: 'ɸ', features: { manner: 'fricative', place: 'bilabial', voicing: 'voiceless' } },
	{ symbol: 'β', features: { manner: 'fricative', place: 'bilabial', voicing: 'voiced' } },
	{ symbol: 'f', features: { manner: 'fricative', place: 'labiodental', voicing: 'voiceless' } },
	{ symbol: 'v', features: { manner: 'fricative', place: 'labiodental', voicing: 'voiced' } },
	{ symbol: 'θ', features: { manner: 'fricative', place: 'dental', voicing: 'voiceless' } },
	{ symbol: 'ð', features: { manner: 'fricative', place: 'dental', voicing: 'voiced' } },
	{ symbol: 's', features: { manner: 'fricative', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 'z', features: { manner: 'fricative', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ʃ', features: { manner: 'fricative', place: 'postalveolar', voicing: 'voiceless' } },
	{ symbol: 'ʒ', features: { manner: 'fricative', place: 'postalveolar', voicing: 'voiced' } },
	{ symbol: 'ʂ', features: { manner: 'fricative', place: 'retroflex', voicing: 'voiceless' } },
	{ symbol: 'ʐ', features: { manner: 'fricative', place: 'retroflex', voicing: 'voiced' } },
	{ symbol: 'ç', features: { manner: 'fricative', place: 'palatal', voicing: 'voiceless' } },
	{ symbol: 'ʝ', features: { manner: 'fricative', place: 'palatal', voicing: 'voiced' } },
	{ symbol: 'x', features: { manner: 'fricative', place: 'velar', voicing: 'voiceless' } },
	{ symbol: 'ɣ', features: { manner: 'fricative', place: 'velar', voicing: 'voiced' } },
	{ symbol: 'χ', features: { manner: 'fricative', place: 'uvular', voicing: 'voiceless' } },
	{ symbol: 'ʁ', features: { manner: 'fricative', place: 'uvular', voicing: 'voiced' } },
	{ symbol: 'ħ', features: { manner: 'fricative', place: 'pharyngeal', voicing: 'voiceless' } },
	{ symbol: 'ʕ', features: { manner: 'fricative', place: 'pharyngeal', voicing: 'voiced' } },
	{ symbol: 'h', features: { manner: 'fricative', place: 'glottal', voicing: 'voiceless' } },
	{ symbol: 'ɦ', features: { manner: 'fricative', place: 'glottal', voicing: 'voiced' } },
	{ symbol: 'ɬ', features: { manner: 'lateral-fricative', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 'ɮ', features: { manner: 'lateral-fricative', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ʋ', features: { manner: 'approximant', place: 'labiodental', voicing: 'voiced' } },
	{ symbol: 'ɹ', features: { manner: 'approximant', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ɻ', features: { manner: 'approximant', place: 'retroflex', voicing: 'voiced' } },
	{ symbol: 'j', features: { manner: 'approximant', place: 'palatal', voicing: 'voiced' } },
	{ symbol: 'ɰ', features: { manner: 'approximant', place: 'velar', voicing: 'voiced' } },
	{ symbol: 'l', features: { manner: 'lateral-approximant', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ɭ', features: { manner: 'lateral-approximant', place: 'retroflex', voicing: 'voiced' } },
	{ symbol: 'ʎ', features: { manner: 'lateral-approximant', place: 'palatal', voicing: 'voiced' } },
	{ symbol: 'ʟ', features: { manner: 'lateral-approximant', place: 'velar', voicing: 'voiced' } },
	{ symbol: 'w', features: { manner: 'approximant', place: 'labial-velar', voicing: 'voiced' } },
	{ symbol: 'ʍ', features: { manner: 'fricative', place: 'labial-velar', voicing: 'voiceless' } },
	{ symbol: 'ɥ', features: { manner: 'approximant', place: 'labial-palatal', voicing: 'voiced' } },
	{ symbol: 'ʜ', features: { manner: 'trill', place: 'epiglottal', voicing: 'voiceless' } },
	{ symbol: 'ʢ', features: { manner: 'trill', place: 'epiglottal', voicing: 'voiced' } },
	{ symbol: 'ʡ', features: { manner: 'plosive', place: 'epiglottal', voicing: 'voiceless' } },
	{ symbol: 'ɕ', features: { manner: 'fricative', place: 'alveolo-palatal', voicing: 'voiceless' } },
	{ symbol: 'ʑ', features: { manner: 'fricative', place: 'alveolo-palatal', voicing: 'voiced' } },
	{ symbol: 'ɺ', features: { manner: 'lateral-tap', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ɧ', features: { manner: 'fricative', place: 'postalveolar-velar', voicing: 'voiceless' } },
	{ symbol: 't͡s', features: { manner: 'affricate', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 'd͡z', features: { manner: 'affricate', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 't͡ʃ', features: { manner: 'affricate', place: 'postalveolar', voicing: 'voiceless' } },
	{ symbol: 'd͡ʒ', features: { manner: 'affricate', place: 'postalveolar', voicing: 'voiced' } },
	{ symbol: 't͡ɕ', features: { manner: 'affricate', place: 'alveolo-palatal', voicing: 'voiceless' } },
	{ symbol: 'd͡ʑ', features: { manner: 'affricate', place: 'alveolo-palatal', voicing: 'voiced' } },
	{ symbol: 'ʈ͡ʂ', features: { manner: 'affricate', place: 'retroflex', voicing: 'voiceless' } },
	{ symbol: 'ɖ͡ʐ', features: { manner: 'affricate', place: 'retroflex', voicing: 'voiced' } },
	{ symbol: 'p͡f', features: { manner: 'affricate', place: 'labiodental', voicing: 'voiceless' } },
	{ symbol: 'b͡v', features: { manner: 'affricate', place: 'labiodental', voicing: 'voiced' } },
	{ symbol: 't͡θ', features: { manner: 'affricate', place: 'dental', voicing: 'voiceless' } },
	{ symbol: 'd͡ð', features: { manner: 'affricate', place: 'dental', voicing: 'voiced' } },
	{ symbol: 'c͡ç', features: { manner: 'affricate', place: 'palatal', voicing: 'voiceless' } },
	{ symbol: 'ɟ͡ʝ', features: { manner: 'affricate', place: 'palatal', voicing: 'voiced' } },
	{ symbol: 'k͡x', features: { manner: 'affricate', place: 'velar', voicing: 'voiceless' } },
	{ symbol: 'ɡ͡ɣ', features: { manner: 'affricate', place: 'velar', voicing: 'voiced' } },
	{ symbol: 'q͡χ', features: { manner: 'affricate', place: 'uvular', voicing: 'voiceless' } },
	{ symbol: 't͡ɬ', features: { manner: 'affricate', place: 'alveolar-lateral', voicing: 'voiceless' } },
	{ symbol: 'd͡ɮ', features: { manner: 'affricate', place: 'alveolar-lateral', voicing: 'voiced' } },
	{ symbol: 'pʼ', features: { manner: 'ejective', place: 'bilabial', voicing: 'voiceless' } },
	{ symbol: 'tʼ', features: { manner: 'ejective', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 'kʼ', features: { manner: 'ejective', place: 'velar', voicing: 'voiceless' } },
	{ symbol: 'qʼ', features: { manner: 'ejective', place: 'uvular', voicing: 'voiceless' } },
	{ symbol: 'sʼ', features: { manner: 'ejective-fricative', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 't͡sʼ', features: { manner: 'ejective-affricate', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 't͡ʃʼ', features: { manner: 'ejective-affricate', place: 'postalveolar', voicing: 'voiceless' } },
	{ symbol: 'ɓ', features: { manner: 'implosive', place: 'bilabial', voicing: 'voiced' } },
	{ symbol: 'ɗ', features: { manner: 'implosive', place: 'alveolar', voicing: 'voiced' } },
	{ symbol: 'ʄ', features: { manner: 'implosive', place: 'palatal', voicing: 'voiced' } },
	{ symbol: 'ɠ', features: { manner: 'implosive', place: 'velar', voicing: 'voiced' } },
	{ symbol: 'ʛ', features: { manner: 'implosive', place: 'uvular', voicing: 'voiced' } },
	{ symbol: 'ʘ', features: { manner: 'click', place: 'bilabial', voicing: 'voiceless' } },
	{ symbol: 'ǀ', features: { manner: 'click', place: 'dental', voicing: 'voiceless' } },
	{ symbol: 'ǃ', features: { manner: 'click', place: 'alveolar', voicing: 'voiceless' } },
	{ symbol: 'ǂ', features: { manner: 'click', place: 'palatal', voicing: 'voiceless' } },
	{ symbol: 'ǁ', features: { manner: 'click', place: 'lateral', voicing: 'voiceless' } }
];

export const IPA_VOWELS: IPASound[] = [
	{ symbol: 'i', features: { height: 'close', backness: 'front', roundedness: 'unrounded' } },
	{ symbol: 'y', features: { height: 'close', backness: 'front', roundedness: 'rounded' } },
	{ symbol: 'ɨ', features: { height: 'close', backness: 'central', roundedness: 'unrounded' } },
	{ symbol: 'ʉ', features: { height: 'close', backness: 'central', roundedness: 'rounded' } },
	{ symbol: 'ɯ', features: { height: 'close', backness: 'back', roundedness: 'unrounded' } },
	{ symbol: 'u', features: { height: 'close', backness: 'back', roundedness: 'rounded' } },
	{ symbol: 'ɪ', features: { height: 'near-close', backness: 'front', roundedness: 'unrounded' } },
	{ symbol: 'ʏ', features: { height: 'near-close', backness: 'front', roundedness: 'rounded' } },
	{ symbol: 'ʊ', features: { height: 'near-close', backness: 'back', roundedness: 'rounded' } },
	{ symbol: 'e', features: { height: 'close-mid', backness: 'front', roundedness: 'unrounded' } },
	{ symbol: 'ø', features: { height: 'close-mid', backness: 'front', roundedness: 'rounded' } },
	{ symbol: 'ɘ', features: { height: 'close-mid', backness: 'central', roundedness: 'unrounded' } },
	{ symbol: 'ɵ', features: { height: 'close-mid', backness: 'central', roundedness: 'rounded' } },
	{ symbol: 'ɤ', features: { height: 'close-mid', backness: 'back', roundedness: 'unrounded' } },
	{ symbol: 'o', features: { height: 'close-mid', backness: 'back', roundedness: 'rounded' } },
	{ symbol: 'ə', features: { height: 'mid', backness: 'central', roundedness: 'unrounded' } },
	{ symbol: 'ɛ', features: { height: 'open-mid', backness: 'front', roundedness: 'unrounded' } },
	{ symbol: 'œ', features: { height: 'open-mid', backness: 'front', roundedness: 'rounded' } },
	{ symbol: 'ɜ', features: { height: 'open-mid', backness: 'central', roundedness: 'unrounded' } },
	{ symbol: 'ɞ', features: { height: 'open-mid', backness: 'central', roundedness: 'rounded' } },
	{ symbol: 'ʌ', features: { height: 'open-mid', backness: 'back', roundedness: 'unrounded' } },
	{ symbol: 'ɔ', features: { height: 'open-mid', backness: 'back', roundedness: 'rounded' } },
	{ symbol: 'æ', features: { height: 'near-open', backness: 'front', roundedness: 'unrounded' } },
	{ symbol: 'ɐ', features: { height: 'near-open', backness: 'central', roundedness: 'unrounded' } },
	{ symbol: 'a', features: { height: 'open', backness: 'front', roundedness: 'unrounded' } },
	{ symbol: 'ɶ', features: { height: 'open', backness: 'front', roundedness: 'rounded' } },
	{ symbol: 'ä', features: { height: 'open', backness: 'central', roundedness: 'unrounded' } },
	{ symbol: 'ɑ', features: { height: 'open', backness: 'back', roundedness: 'unrounded' } },
	{ symbol: 'ɒ', features: { height: 'open', backness: 'back', roundedness: 'rounded' } }
];

export const IPA_DIPHTHONGS: IPASound[] = [
	{ symbol: 'aɪ', features: { type: 'diphthong', start: 'open-front', end: 'close-front', direction: 'closing' } },
	{ symbol: 'aʊ', features: { type: 'diphthong', start: 'open-front', end: 'close-back', direction: 'closing' } },
	{ symbol: 'eɪ', features: { type: 'diphthong', start: 'close-mid-front', end: 'close-front', direction: 'closing' } },
	{ symbol: 'oʊ', features: { type: 'diphthong', start: 'close-mid-back', end: 'close-back', direction: 'closing' } },
	{ symbol: 'ɔɪ', features: { type: 'diphthong', start: 'open-mid-back', end: 'close-front', direction: 'closing' } },
	{ symbol: 'əʊ', features: { type: 'diphthong', start: 'mid-central', end: 'close-back', direction: 'closing' } },
	{ symbol: 'ɪə', features: { type: 'diphthong', start: 'near-close-front', end: 'mid-central', direction: 'centering' } },
	{ symbol: 'eə', features: { type: 'diphthong', start: 'close-mid-front', end: 'mid-central', direction: 'centering' } },
	{ symbol: 'ʊə', features: { type: 'diphthong', start: 'near-close-back', end: 'mid-central', direction: 'centering' } },
	{ symbol: 'ɔə', features: { type: 'diphthong', start: 'open-mid-back', end: 'mid-central', direction: 'centering' } },
	{ symbol: 'aɪ̯', features: { type: 'diphthong', start: 'open-front', end: 'close-front', direction: 'closing' } },
	{ symbol: 'aʊ̯', features: { type: 'diphthong', start: 'open-front', end: 'close-back', direction: 'closing' } },
	{ symbol: 'ɛɪ', features: { type: 'diphthong', start: 'open-mid-front', end: 'close-front', direction: 'closing' } },
	{ symbol: 'ɛʊ', features: { type: 'diphthong', start: 'open-mid-front', end: 'close-back', direction: 'closing' } },
	{ symbol: 'ɔʊ', features: { type: 'diphthong', start: 'open-mid-back', end: 'close-back', direction: 'closing' } },
	{ symbol: 'ɐʊ', features: { type: 'diphthong', start: 'near-open-central', end: 'close-back', direction: 'closing' } },
	{ symbol: 'ɐɪ', features: { type: 'diphthong', start: 'near-open-central', end: 'close-front', direction: 'closing' } },
	{ symbol: 'ʌɪ', features: { type: 'diphthong', start: 'open-mid-back', end: 'close-front', direction: 'closing' } },
	{ symbol: 'iə', features: { type: 'diphthong', start: 'close-front', end: 'mid-central', direction: 'opening' } },
	{ symbol: 'uə', features: { type: 'diphthong', start: 'close-back', end: 'mid-central', direction: 'opening' } },
	{ symbol: 'ue', features: { type: 'diphthong', start: 'close-back', end: 'close-mid-front', direction: 'opening' } },
	{ symbol: 'ie', features: { type: 'diphthong', start: 'close-front', end: 'close-mid-front', direction: 'opening' } },
	{ symbol: 'uo', features: { type: 'diphthong', start: 'close-back', end: 'close-mid-back', direction: 'opening' } },
	{ symbol: 'ia', features: { type: 'diphthong', start: 'close-front', end: 'open-front', direction: 'opening' } },
	{ symbol: 'ua', features: { type: 'diphthong', start: 'close-back', end: 'open-front', direction: 'opening' } },
	{ symbol: 'io', features: { type: 'diphthong', start: 'close-front', end: 'close-mid-back', direction: 'opening' } },
	{ symbol: 'eu', features: { type: 'diphthong', start: 'close-mid-front', end: 'close-back', direction: 'closing' } },
	{ symbol: 'øy', features: { type: 'diphthong', start: 'close-mid-front-rounded', end: 'close-front-rounded', direction: 'closing' } },
	{ symbol: 'œy', features: { type: 'diphthong', start: 'open-mid-front-rounded', end: 'close-front-rounded', direction: 'closing' } },
	{ symbol: 'ɑɪ', features: { type: 'diphthong', start: 'open-back', end: 'close-front', direction: 'closing' } },
	{ symbol: 'ɑʊ', features: { type: 'diphthong', start: 'open-back', end: 'close-back', direction: 'closing' } },
	{ symbol: 'æɪ', features: { type: 'diphthong', start: 'near-open-front', end: 'close-front', direction: 'closing' } },
	{ symbol: 'æʊ', features: { type: 'diphthong', start: 'near-open-front', end: 'close-back', direction: 'closing' } },
	{ symbol: 'ɑe', features: { type: 'diphthong', start: 'open-back', end: 'close-mid-front', direction: 'closing' } },
	{ symbol: 'ɑo', features: { type: 'diphthong', start: 'open-back', end: 'close-mid-back', direction: 'closing' } }
];

export const IPA_DIACRITICS: IPADiacritic[] = [
	{ symbol: 'ʰ', name: 'aspirated', position: 'after' },
	{ symbol: 'ʷ', name: 'labialized', position: 'after' },
	{ symbol: 'ʲ', name: 'palatalized', position: 'after' },
	{ symbol: 'ˠ', name: 'velarized', position: 'after' },
	{ symbol: 'ˤ', name: 'pharyngealized', position: 'after' },
	{ symbol: 'ⁿ', name: 'nasal-release', position: 'after' },
	{ symbol: 'ˡ', name: 'lateral-release', position: 'after' },
	{ symbol: '̥', name: 'voiceless', position: 'under' },
	{ symbol: '̬', name: 'voiced', position: 'under' },
	{ symbol: '̤', name: 'breathy', position: 'under' },
	{ symbol: '̰', name: 'creaky', position: 'under' },
	{ symbol: '̪', name: 'dental', position: 'under' },
	{ symbol: '̺', name: 'apical', position: 'under' },
	{ symbol: '̻', name: 'laminal', position: 'under' },
	{ symbol: '̼', name: 'linguolabial', position: 'under' },
	{ symbol: '̃', name: 'nasalized', position: 'over' },
	{ symbol: 'ː', name: 'long', position: 'after' },
	{ symbol: 'ˑ', name: 'half-long', position: 'after' },
	{ symbol: '̆', name: 'extra-short', position: 'over' },
	{ symbol: '̩', name: 'syllabic', position: 'under' },
	{ symbol: '̯', name: 'non-syllabic', position: 'under' },
	{ symbol: '˥', name: 'extra-high-tone', position: 'after' },
	{ symbol: '˦', name: 'high-tone', position: 'after' },
	{ symbol: '˧', name: 'mid-tone', position: 'after' },
	{ symbol: '˨', name: 'low-tone', position: 'after' },
	{ symbol: '˩', name: 'extra-low-tone', position: 'after' },
	{ symbol: '̋', name: 'extra-high', position: 'over' },
	{ symbol: '́', name: 'high', position: 'over' },
	{ symbol: '̄', name: 'mid', position: 'over' },
	{ symbol: '̀', name: 'low', position: 'over' },
	{ symbol: '̏', name: 'extra-low', position: 'over' }
];

export const PLACES_OF_ARTICULATION = [
	'bilabial', 'labiodental', 'dental', 'alveolar', 'postalveolar',
	'retroflex', 'alveolo-palatal', 'palatal', 'velar', 'uvular',
	'pharyngeal', 'epiglottal', 'glottal', 'labial-velar', 'labial-palatal',
	'postalveolar-velar'
] as const;

export const MANNERS_OF_ARTICULATION = [
	'plosive', 'nasal', 'trill', 'tap', 'fricative', 'lateral-fricative',
	'approximant', 'lateral-approximant', 'lateral-tap', 'affricate'
] as const;

export const VOWEL_HEIGHTS = [
	'close', 'near-close', 'close-mid', 'mid', 'open-mid', 'near-open', 'open'
] as const;

export const VOWEL_BACKNESS = [
	'front', 'central', 'back'
] as const;

export interface IPASound {
	symbol: string;
	features: Record<string, string>;
}

export interface IPADiacritic {
	symbol: string;
	name: string;
	position: 'before' | 'after' | 'over' | 'under';
}

export function getPhonemeByFeatures(features: Record<string, string>, type: 'consonant' | 'vowel'): IPASound | undefined {
	const sounds = type === 'consonant' ? IPA_CONSONANTS : IPA_VOWELS;
	return sounds.find(sound => {
		return Object.entries(features).every(([key, value]) => sound.features[key] === value);
	});
}

export function getFeaturesBySymbol(symbol: string): { type: 'consonant' | 'vowel' | 'diphthong'; features: Record<string, string> } | undefined {
	const consonant = IPA_CONSONANTS.find(s => s.symbol === symbol);
	if (consonant) return { type: 'consonant', features: consonant.features };
	
	const vowel = IPA_VOWELS.find(s => s.symbol === symbol);
	if (vowel) return { type: 'vowel', features: vowel.features };
	
	const diphthong = IPA_DIPHTHONGS.find(s => s.symbol === symbol);
	if (diphthong) return { type: 'diphthong', features: diphthong.features };
	
	return undefined;
}

export function isVowel(symbol: string): boolean {
	return IPA_VOWELS.some(v => v.symbol === symbol);
}

export function isConsonant(symbol: string): boolean {
	return IPA_CONSONANTS.some(c => c.symbol === symbol);
}

export function isDiphthong(symbol: string): boolean {
	return IPA_DIPHTHONGS.some(d => d.symbol === symbol);
}

export function getDiphthongInfo(symbol: string): IPASound | undefined {
	return IPA_DIPHTHONGS.find(d => d.symbol === symbol);
}

const AFFRICATE_SYMBOLS = IPA_CONSONANTS.filter(c => c.features.manner === 'affricate').map(c => c.symbol);
const DIPHTHONG_SYMBOLS = IPA_DIPHTHONGS.map(d => d.symbol).sort((a, b) => b.length - a.length);

export function parseIPAString(ipa: string): string[] {
	const segments: string[] = [];
	let i = 0;
	
	while (i < ipa.length) {
		let matched = false;
		
		for (const diph of DIPHTHONG_SYMBOLS) {
			if (ipa.slice(i, i + diph.length) === diph) {
				segments.push(diph);
				i += diph.length;
				matched = true;
				break;
			}
		}
		
		if (!matched) {
			for (const aff of AFFRICATE_SYMBOLS) {
				if (ipa.slice(i, i + aff.length) === aff) {
					segments.push(aff);
					i += aff.length;
					matched = true;
					break;
				}
			}
		}
		
		if (!matched) {
			let segment = ipa[i];
			i++;
			
			while (i < ipa.length && IPA_DIACRITICS.some(d => ipa[i] === d.symbol || ipa.charCodeAt(i) >= 0x0300 && ipa.charCodeAt(i) <= 0x036F)) {
				segment += ipa[i];
				i++;
			}
			
			if (segment.trim()) {
				segments.push(segment);
			}
		}
	}
	
	return segments;
}

export function categorizePhonemes(phonemes: { symbol: string; ipa: string; features?: Record<string, string> }[]): {
	consonants: Map<string, Map<string, typeof phonemes>>;
	vowels: Map<string, Map<string, typeof phonemes>>;
	diphthongs: typeof phonemes;
} {
	const consonants = new Map<string, Map<string, typeof phonemes>>();
	const vowels = new Map<string, Map<string, typeof phonemes>>();
	const diphthongs: typeof phonemes = [];
	
	for (const phoneme of phonemes) {
		if (isDiphthong(phoneme.ipa)) {
			diphthongs.push(phoneme);
			continue;
		}
		
		const info = getFeaturesBySymbol(phoneme.ipa);
		if (!info) continue;
		
		if (info.type === 'consonant') {
			const place = info.features.place ?? 'unknown';
			const manner = info.features.manner ?? 'unknown';
			
			if (!consonants.has(manner)) consonants.set(manner, new Map());
			if (!consonants.get(manner)!.has(place)) consonants.get(manner)!.set(place, []);
			consonants.get(manner)!.get(place)!.push(phoneme);
		} else {
			const height = info.features.height ?? 'unknown';
			const backness = info.features.backness ?? 'unknown';
			
			if (!vowels.has(height)) vowels.set(height, new Map());
			if (!vowels.get(height)!.has(backness)) vowels.get(height)!.set(backness, []);
			vowels.get(height)!.get(backness)!.push(phoneme);
		}
	}
	
	return { consonants, vowels, diphthongs };
}
