<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from '$lib/components/ui';
	
	let activeSection = $state('introduction');
	
	const sections = [
		{ id: 'introduction', label: 'Introduction', icon: '📚' },
		{ id: 'getting-started', label: 'Getting Started', icon: '🚀' },
		{ id: 'phonology', label: 'Phonology', icon: '🔊' },
		{ id: 'morphology', label: 'Morphology', icon: '🧩' },
		{ id: 'syntax', label: 'Syntax', icon: '📝' },
		{ id: 'lexicon', label: 'Lexicon', icon: '📖' },
		{ id: 'scripts', label: 'Writing Systems', icon: '✍️' },
		{ id: 'texts', label: 'Texts & Glossing', icon: '📜' },
		{ id: 'tools', label: 'Tools', icon: '🛠️' }
	];
	
	function scrollToSection(id: string) {
		activeSection = id;
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
	
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeSection = entry.target.id;
						break;
					}
				}
			},
			{
				rootMargin: '-20% 0px -60% 0px',
				threshold: 0
			}
		);
		
		for (const section of sections) {
			const el = document.getElementById(section.id);
			if (el) observer.observe(el);
		}
		
		return () => observer.disconnect();
	});
</script>

<div class="guide-page">
	<nav class="guide-nav">
		<div class="nav-header">
			<h2>Conlanging Guide</h2>
			<p>Learn to create languages</p>
		</div>
		<ul class="nav-list">
			{#each sections as section}
				<li>
					<button 
						class="nav-item" 
						class:active={activeSection === section.id}
						onclick={() => scrollToSection(section.id)}
					>
						<span class="nav-icon">{section.icon}</span>
						<span>{section.label}</span>
					</button>
				</li>
			{/each}
		</ul>
		<a href="/" class="back-link">← Back to Languages</a>
	</nav>
	
	<main class="guide-content">
		<section id="introduction" class="guide-section">
			<h1>Introduction to Conlanging</h1>
			
			<p class="lead">
				Conlanging (constructed language creation) is the art and science of creating new languages. 
				Whether you're building a language for a fantasy world, exploring linguistic concepts, or 
				just having fun, this guide will teach you the fundamentals.
			</p>
			
			<h2>What is a Conlang?</h2>
			<p>
				A <strong>constructed language</strong> (conlang) is a language that has been deliberately 
				created rather than having evolved naturally. Famous examples include:
			</p>
			<ul>
				<li><strong>Esperanto</strong> — designed for international communication</li>
				<li><strong>Quenya & Sindarin</strong> — Tolkien's Elvish languages</li>
				<li><strong>Klingon</strong> — created for Star Trek</li>
				<li><strong>Dothraki & High Valyrian</strong> — from Game of Thrones</li>
				<li><strong>Na'vi</strong> — from Avatar</li>
			</ul>
			
			<h2>Components of a Language</h2>
			<p>Every language consists of several interconnected systems:</p>
			
			<div class="component-grid">
				<div class="component-card">
					<h3>Phonology</h3>
					<p>The sound system — what sounds exist and how they combine</p>
				</div>
				<div class="component-card">
					<h3>Morphology</h3>
					<p>Word structure — how words are built from smaller meaningful units</p>
				</div>
				<div class="component-card">
					<h3>Syntax</h3>
					<p>Sentence structure — how words combine into phrases and sentences</p>
				</div>
				<div class="component-card">
					<h3>Lexicon</h3>
					<p>Vocabulary — the words and their meanings</p>
				</div>
				<div class="component-card">
					<h3>Semantics</h3>
					<p>Meaning — how words and sentences convey meaning</p>
				</div>
				<div class="component-card">
					<h3>Writing System</h3>
					<p>Optional but fun — how the language is written</p>
				</div>
			</div>
			
			<h2>How to Use This Platform</h2>
			<p>
				Conlanger provides tools for each component of language creation. The typical workflow is:
			</p>
			<ol>
				<li><strong>Create a language</strong> on the home page</li>
				<li><strong>Define your phonology</strong> — choose sounds, syllable structures</li>
				<li><strong>Build your morphology</strong> — create grammar categories and affixes</li>
				<li><strong>Set up syntax</strong> — define word order and sentence patterns</li>
				<li><strong>Add vocabulary</strong> — build your lexicon</li>
				<li><strong>Create a writing system</strong> (optional)</li>
				<li><strong>Write texts</strong> — practice using your language</li>
			</ol>
			
			<div class="tip-box">
				<strong>Tip:</strong> Enable <strong>Help Mode</strong> (button in the top right) to see 
				explanations for every field in the application. Hover over the <span class="help-icon">?</span> 
				icons for detailed guidance.
			</div>
		</section>
		
		<section id="getting-started" class="guide-section">
			<h1>Getting Started</h1>
			
			<h2>Creating Your First Language</h2>
			<p>
				From the home page, click "New Language" to create your conlang. You'll need to provide:
			</p>
			<ul>
				<li><strong>Name</strong> — What is your language called?</li>
				<li><strong>Native Name</strong> (optional) — What do speakers call it in the language itself?</li>
				<li><strong>Description</strong> — A brief overview of your language's concept</li>
			</ul>
			
			<h2>Design Philosophy</h2>
			<p>Before diving into the technical details, consider some high-level questions:</p>
			
			<div class="question-list">
				<div class="question">
					<h4>What's the purpose?</h4>
					<p>A personal artistic language? A fictional culture's language? An auxiliary language for communication?</p>
				</div>
				<div class="question">
					<h4>What's the aesthetic?</h4>
					<p>Should it sound harsh or flowing? Simple or complex? Familiar or alien?</p>
				</div>
				<div class="question">
					<h4>What inspired you?</h4>
					<p>Real languages you admire? A fictional setting? Abstract concepts?</p>
				</div>
				<div class="question">
					<h4>Who speaks it?</h4>
					<p>What culture or species? What's their history and worldview?</p>
				</div>
			</div>
			
			<h2>The Overview Page</h2>
			<p>
				Once you create a language, you'll see the Overview page. This dashboard shows:
			</p>
			<ul>
				<li>Quick statistics about your language</li>
				<li>Navigation tabs to each section (Phonology, Morphology, etc.)</li>
				<li>A summary of what you've created so far</li>
			</ul>
		</section>
		
		<section id="phonology" class="guide-section">
			<h1>Phonology</h1>
			<p class="lead">
				Phonology is the study of sounds in language. It's typically the first system you'll design 
				because everything else builds on it.
			</p>
			
			<h2>Phonemes vs. Phones</h2>
			<p>
				A <strong>phoneme</strong> is a meaningful sound unit — changing it changes the word's meaning. 
				A <strong>phone</strong> is any actual sound produced.
			</p>
			<div class="example-box">
				<p><strong>Example:</strong> In English, /p/ and /b/ are different phonemes:</p>
				<ul>
					<li><em>pat</em> /pæt/ vs. <em>bat</em> /bæt/ — different meanings!</li>
				</ul>
				<p>But [pʰ] (aspirated p) and [p] (unaspirated p) are allophones of /p/:</p>
				<ul>
					<li><em>pin</em> [pʰɪn] vs. <em>spin</em> [spɪn] — the /p/ sounds different, but it's the same phoneme. No English speaker perceives these as different sounds.</li>
				</ul>
			</div>
			
			<h2>Consonants</h2>
			<p>Consonants are classified by three features:</p>
			
			<h3>Place of Articulation</h3>
			<p>Where in the mouth the sound is made:</p>
			<ul>
				<li><strong>Bilabial</strong> — both lips (p, b, m)</li>
				<li><strong>Labiodental</strong> — lip and teeth (f, v)</li>
				<li><strong>Dental/Alveolar</strong> — tongue and teeth/ridge (t, d, s, n, l)</li>
				<li><strong>Postalveolar</strong> — behind the alveolar ridge (ʃ, ʒ, tʃ, dʒ)</li>
				<li><strong>Palatal</strong> — tongue and hard palate (j, ɲ, c)</li>
				<li><strong>Velar</strong> — tongue and soft palate (k, g, ŋ)</li>
				<li><strong>Uvular</strong> — tongue and uvula (q, ʁ)</li>
				<li><strong>Glottal</strong> — in the throat (h, ʔ)</li>
			</ul>
			
			<h3>Manner of Articulation</h3>
			<p>How the airflow is modified:</p>
			<ul>
				<li><strong>Plosives/Stops</strong> — complete blockage then release (p, t, k)</li>
				<li><strong>Fricatives</strong> — turbulent airflow (f, s, ʃ)</li>
				<li><strong>Affricates</strong> — stop + fricative (tʃ, dʒ)</li>
				<li><strong>Nasals</strong> — air through nose (m, n, ŋ)</li>
				<li><strong>Approximants</strong> — little obstruction (w, j, l, ɹ)</li>
				<li><strong>Trills</strong> — vibrating articulator (r)</li>
			</ul>
			
			<h3>Voicing</h3>
			<p>Whether the vocal cords vibrate:</p>
			<ul>
				<li><strong>Voiced</strong> — vocal cords vibrate (b, d, g, z)</li>
				<li><strong>Voiceless</strong> — no vibration (p, t, k, s)</li>
			</ul>
			
			<h2>Vowels</h2>
			<p>Vowels are classified by:</p>
			<ul>
				<li><strong>Height</strong> — how open the mouth is (high/close, mid, low/open)</li>
				<li><strong>Backness</strong> — tongue position (front, central, back)</li>
				<li><strong>Roundedness</strong> — lip shape (rounded or unrounded)</li>
			</ul>
			
			<div class="example-box">
				<p><strong>Common vowel systems:</strong></p>
				<ul>
					<li><strong>3-vowel:</strong> /a i u/ — very simple, found in Arabic</li>
					<li><strong>5-vowel:</strong> /a e i o u/ — Spanish, Japanese, very common</li>
					<li><strong>7+ vowel:</strong> /a e ɛ i o ɔ u/ — more complex, like Italian</li>
				</ul>
			</div>
			
			<h2>Allophones</h2>
			<p>
				Allophones are predictable variants of a phoneme in specific environments. 
				They don't change meaning — native speakers often don't notice the difference.
			</p>
			
			<h3>Using Allophones in Conlanger</h3>
			<p>To add an allophone:</p>
			<ol>
				<li>Go to the Phonology page, Allophones section</li>
				<li>Click "Add Allophone"</li>
				<li>Select the parent phoneme</li>
				<li>Enter the allophonic pronunciation</li>
				<li>Describe the environment using standard notation</li>
			</ol>
			
			<h3>Environment Notation</h3>
			<table class="notation-table">
				<thead>
					<tr><th>Symbol</th><th>Meaning</th><th>Example</th></tr>
				</thead>
				<tbody>
					<tr><td>_</td><td>Position of the sound</td><td>V_V (between vowels)</td></tr>
					<tr><td>#</td><td>Word boundary</td><td>#_ (word-initial)</td></tr>
					<tr><td>V</td><td>Any vowel</td><td>_V (before a vowel)</td></tr>
					<tr><td>C</td><td>Any consonant</td><td>C_ (after a consonant)</td></tr>
				</tbody>
			</table>
			
			<div class="example-box">
				<p><strong>Example:</strong> /t/ becomes [ɾ] between vowels (flapping)</p>
				<p>Environment: <code>V_V</code></p>
				<p>Result: "water" /wɑtər/ → [wɑɾər]</p>
			</div>
			
			<h2>Phonotactics</h2>
			<p>
				Phonotactics are the rules for which sounds can appear together. 
				This defines your syllable structure and consonant clusters.
			</p>
			
			<h3>Syllable Structure</h3>
			<p>A syllable has three parts:</p>
			<ul>
				<li><strong>Onset</strong> — initial consonant(s)</li>
				<li><strong>Nucleus</strong> — the vowel (required)</li>
				<li><strong>Coda</strong> — final consonant(s)</li>
			</ul>
			
			<p>Common patterns (C = consonant, V = vowel):</p>
			<table class="notation-table">
				<thead>
					<tr><th>Pattern</th><th>Example</th><th>Languages</th></tr>
				</thead>
				<tbody>
					<tr><td>CV</td><td>ma, ti, ko</td><td>Japanese (mostly), Hawaiian</td></tr>
					<tr><td>(C)V</td><td>a, ma, i, ti</td><td>Many languages</td></tr>
					<tr><td>CVC</td><td>mat, tin, kop</td><td>Arabic roots</td></tr>
					<tr><td>(C)(C)V(C)(C)</td><td>strengths</td><td>English (complex!)</td></tr>
				</tbody>
			</table>
			
			<h3>Using Phonotactics in Conlanger</h3>
			<p>
				Define your syllable patterns in the Phonotactics section. These are used by the 
				Word Generator tool to create words that follow your rules.
			</p>
			
			<h2>Sound Changes</h2>
			<p>
				Sound changes show how pronunciation evolves over time. They're written as rules:
			</p>
			<pre class="code-block">A → B / X_Y</pre>
			<p>Meaning: "A becomes B when preceded by X and followed by Y"</p>
			
			<div class="example-box">
				<p><strong>Common sound changes:</strong></p>
				<ul>
					<li><code>k → tʃ / _i</code> — k becomes ch before i (palatalization)</li>
					<li><code>t → ɾ / V_V</code> — t becomes flap between vowels (flapping)</li>
					<li><code>s → h / #_</code> — s becomes h at word start (debuccalization)</li>
					<li><code>a → ∅ / _#</code> — final a is deleted (apocope)</li>
				</ul>
			</div>
		</section>
		
		<section id="morphology" class="guide-section">
			<h1>Morphology</h1>
			<p class="lead">
				Morphology is the study of word structure — how words are built from smaller meaningful pieces.
			</p>
			
			<h2>What is a Morpheme?</h2>
			<p>
				A <strong>morpheme</strong> is the smallest unit of meaning. Words can contain one or more morphemes.
			</p>
			<div class="example-box">
				<p><strong>Example:</strong> "unhappiness" has 3 morphemes:</p>
				<ul>
					<li><strong>un-</strong> (prefix meaning "not")</li>
					<li><strong>happy</strong> (root meaning "happy")</li>
					<li><strong>-ness</strong> (suffix making it a noun)</li>
				</ul>
			</div>
			
			<h2>Types of Morphemes</h2>
			
			<h3>By Position</h3>
			<ul>
				<li><strong>Root/Stem</strong> — the core meaning (walk, book, happy)</li>
				<li><strong>Prefix</strong> — attaches before (un-, re-, pre-)</li>
				<li><strong>Suffix</strong> — attaches after (-ing, -ed, -ness)</li>
				<li><strong>Infix</strong> — inserts inside (Tagalog: sulat → s-um-ulat)</li>
				<li><strong>Circumfix</strong> — wraps around (German: machen → ge-mach-t)</li>
			</ul>
			
			<h3>By Function</h3>
			<ul>
				<li><strong>Derivational</strong> — creates new words (happy → happiness)</li>
				<li><strong>Inflectional</strong> — shows grammar (walk → walks, walked)</li>
			</ul>
			
			<h2>Grammar Categories</h2>
			<p>
				Grammar categories are the features that words can express through inflection. 
				Different word classes have different categories.
			</p>
			
			<h3>Common Noun Categories</h3>
			<table class="notation-table">
				<thead>
					<tr><th>Category</th><th>Values</th><th>Example</th></tr>
				</thead>
				<tbody>
					<tr><td>Number</td><td>Singular, Plural, Dual</td><td>cat/cats</td></tr>
					<tr><td>Case</td><td>Nominative, Accusative, Genitive, Dative...</td><td>Latin: rosa, rosam, rosae</td></tr>
					<tr><td>Gender</td><td>Masculine, Feminine, Neuter</td><td>Spanish: el/la</td></tr>
					<tr><td>Definiteness</td><td>Definite, Indefinite</td><td>the/a</td></tr>
				</tbody>
			</table>
			
			<h3>Common Verb Categories</h3>
			<table class="notation-table">
				<thead>
					<tr><th>Category</th><th>Values</th><th>Example</th></tr>
				</thead>
				<tbody>
					<tr><td>Tense</td><td>Past, Present, Future</td><td>walked, walk, will walk</td></tr>
					<tr><td>Aspect</td><td>Perfective, Imperfective, Progressive</td><td>ate, was eating</td></tr>
					<tr><td>Mood</td><td>Indicative, Subjunctive, Imperative</td><td>goes, go (subjunctive), go!</td></tr>
					<tr><td>Voice</td><td>Active, Passive</td><td>eats, is eaten</td></tr>
					<tr><td>Person</td><td>1st, 2nd, 3rd</td><td>I go, you go, she goes</td></tr>
				</tbody>
			</table>
			
			<h3>Using Grammar Categories in Conlanger</h3>
			<ol>
				<li>Go to Morphology → Grammar Categories</li>
				<li>Click "Add Category"</li>
				<li>Enter the category name (e.g., "Number")</li>
				<li>Add values with abbreviations (e.g., "singular:SG", "plural:PL")</li>
				<li>Select which word classes this applies to</li>
			</ol>
			
			<h2>Allomorphs</h2>
			<p>
				Just like phonemes have allophones, morphemes can have <strong>allomorphs</strong> — 
				different forms in different environments.
			</p>
			<div class="example-box">
				<p><strong>English plural has allomorphs:</strong></p>
				<ul>
					<li><strong>-s</strong> [s] after voiceless sounds: cat<em>s</em></li>
					<li><strong>-s</strong> [z] after voiced sounds: dog<em>s</em></li>
					<li><strong>-es</strong> [ɪz] after sibilants: box<em>es</em></li>
				</ul>
			</div>
			
			<h2>Inflection Classes</h2>
			<p>
				Languages often have multiple patterns for the same inflection. These are called 
				<strong>inflection classes</strong> (or declensions for nouns, conjugations for verbs).
			</p>
			<div class="example-box">
				<p><strong>Latin has 5 noun declensions:</strong></p>
				<p>1st declension (feminine): puella, puellae, puellam...</p>
				<p>2nd declension (masculine): servus, servi, servum...</p>
				<p>Words follow different patterns based on their class.</p>
			</div>
			
			<h3>Using Inflection Classes in Conlanger</h3>
			<ol>
				<li>Go to Morphology → Inflection Classes</li>
				<li>Click "Add Class"</li>
				<li>Name it (e.g., "1st Declension", "Strong Verbs")</li>
				<li>Select the word class (noun, verb, etc.)</li>
				<li>Define the paradigm — all the forms with their features</li>
			</ol>
			
			<h2>Morphological Typology</h2>
			<p>Languages fall on a spectrum of how they use morphology:</p>
			
			<div class="component-grid">
				<div class="component-card">
					<h4>Isolating</h4>
					<p>One morpheme per word. Meaning comes from word order and particles.</p>
					<p><em>Examples: Mandarin, Vietnamese</em></p>
				</div>
				<div class="component-card">
					<h4>Agglutinative</h4>
					<p>Many morphemes stack up, each with one clear meaning.</p>
					<p><em>Examples: Turkish, Japanese, Finnish</em></p>
				</div>
				<div class="component-card">
					<h4>Fusional</h4>
					<p>Morphemes fuse together, expressing multiple meanings at once.</p>
					<p><em>Examples: Latin, Russian, Spanish</em></p>
				</div>
				<div class="component-card">
					<h4>Polysynthetic</h4>
					<p>Entire sentences in a single complex word.</p>
					<p><em>Examples: Inuktitut, Mohawk</em></p>
				</div>
			</div>
		</section>
		
		<section id="syntax" class="guide-section">
			<h1>Syntax</h1>
			<p class="lead">
				Syntax is the study of sentence structure — how words combine into phrases and sentences.
			</p>
			
			<h2>Word Order</h2>
			<p>
				The basic word order describes how Subject (S), Verb (V), and Object (O) are arranged.
			</p>
			
			<table class="notation-table">
				<thead>
					<tr><th>Order</th><th>Example</th><th>Languages</th></tr>
				</thead>
				<tbody>
					<tr><td>SVO</td><td>"I eat apples"</td><td>English, Mandarin, Spanish</td></tr>
					<tr><td>SOV</td><td>"I apples eat"</td><td>Japanese, Korean, Hindi, Latin</td></tr>
					<tr><td>VSO</td><td>"Eat I apples"</td><td>Irish, Welsh, Arabic (Classical)</td></tr>
					<tr><td>VOS</td><td>"Eat apples I"</td><td>Malagasy, some Mayan</td></tr>
					<tr><td>OVS</td><td>"Apples eat I"</td><td>Hixkaryana (rare)</td></tr>
					<tr><td>OSV</td><td>"Apples I eat"</td><td>Very rare (Yoda-speak!)</td></tr>
				</tbody>
			</table>
			
			<h2>Word Order Correlations</h2>
			<p>
				Basic word order tends to correlate with other patterns. These aren't strict rules, 
				but strong tendencies:
			</p>
			
			<h3>Head-Initial Languages (like SVO, VSO)</h3>
			<ul>
				<li>Prepositions: <em>in</em> the house</li>
				<li>Noun-Adjective: casa <em>grande</em> (Spanish: "house big")</li>
				<li>Noun-Genitive: house <em>of stone</em></li>
				<li>Auxiliary-Verb: <em>will</em> go</li>
			</ul>
			
			<h3>Head-Final Languages (like SOV)</h3>
			<ul>
				<li>Postpositions: house <em>in</em></li>
				<li>Adjective-Noun: <em>big</em> house</li>
				<li>Genitive-Noun: <em>stone</em> house</li>
				<li>Verb-Auxiliary: go <em>will</em></li>
			</ul>
			
			<h2>Sentence Types</h2>
			
			<h3>Questions</h3>
			<p>Languages form questions in different ways:</p>
			<ul>
				<li><strong>Intonation only</strong> — same words, different pitch</li>
				<li><strong>Question particle</strong> — add a word like "ka" (Japanese)</li>
				<li><strong>Word order change</strong> — "You are going" → "Are you going?"</li>
				<li><strong>Question words</strong> — who, what, where, etc.</li>
			</ul>
			
			<h3>Negation</h3>
			<p>Where does the negative go?</p>
			<ul>
				<li><strong>Before verb</strong> — "I not go" (Japanese, many languages)</li>
				<li><strong>After verb</strong> — "I go not" (German subordinate clauses)</li>
				<li><strong>Around verb</strong> — French "ne...pas" wraps the verb</li>
				<li><strong>Negative verb</strong> — a special verb form (Finnish)</li>
				<li><strong>Multiple negation</strong> — "I don't know nothing" (many dialects)</li>
			</ul>
			
			<h2>Syntax Rules in Conlanger</h2>
			<p>
				Use the Syntax page to define your language's patterns. The rules use 
				phrase structure notation:
			</p>
			<pre class="code-block">S → NP VP
VP → V NP
NP → (Det) (Adj) N</pre>
			<p>Meaning:</p>
			<ul>
				<li>A sentence (S) consists of a noun phrase (NP) and verb phrase (VP)</li>
				<li>A verb phrase consists of a verb (V) and noun phrase</li>
				<li>A noun phrase has an optional determiner, optional adjective, and noun</li>
			</ul>
		</section>
		
		<section id="lexicon" class="guide-section">
			<h1>Lexicon</h1>
			<p class="lead">
				The lexicon is your language's vocabulary — all its words and their meanings.
			</p>
			
			<h2>Word Classes</h2>
			<p>Most languages have these basic word classes (parts of speech):</p>
			<ul>
				<li><strong>Nouns</strong> — people, places, things, ideas</li>
				<li><strong>Verbs</strong> — actions, states, events</li>
				<li><strong>Adjectives</strong> — describe nouns</li>
				<li><strong>Adverbs</strong> — modify verbs, adjectives, other adverbs</li>
				<li><strong>Adpositions</strong> — prepositions or postpositions (in, on, under)</li>
				<li><strong>Pronouns</strong> — stand in for nouns (I, you, they)</li>
				<li><strong>Determiners</strong> — the, a, this, that</li>
				<li><strong>Conjunctions</strong> — and, or, but, because</li>
				<li><strong>Interjections</strong> — oh!, wow!, ouch!</li>
			</ul>
			
			<h2>Creating Words</h2>
			
			<h3>The Word Generator</h3>
			<p>
				Use the Word Generator (Tools page) to create words that follow your phonotactics. 
				This ensures consistency in how words sound.
			</p>
			
			<h3>Semantic Fields</h3>
			<p>A good approach is to build vocabulary by semantic field:</p>
			<ul>
				<li>Basic verbs (be, have, do, go, see, say...)</li>
				<li>Body parts</li>
				<li>Family terms</li>
				<li>Numbers</li>
				<li>Colors</li>
				<li>Nature (water, fire, earth, sky...)</li>
				<li>Common objects</li>
			</ul>
			
			<div class="tip-box">
				<strong>Tip:</strong> The <a href="https://en.wikipedia.org/wiki/Swadesh_list" target="_blank">Swadesh List</a> 
				is a standard list of ~200 basic vocabulary items. It's a great starting point!
			</div>
			
			<h2>Etymology</h2>
			<p>
				Words have histories! Tracking etymology makes your language feel more authentic:
			</p>
			<ul>
				<li><strong>Compound words</strong> — sun + rise = sunrise</li>
				<li><strong>Derivation</strong> — happy → happiness, unhappy</li>
				<li><strong>Borrowing</strong> — words from other languages</li>
				<li><strong>Semantic shift</strong> — meaning changes over time</li>
			</ul>
			
			<h2>Word Relations</h2>
			<p>Track relationships between words:</p>
			<ul>
				<li><strong>Synonyms</strong> — similar meaning (big, large)</li>
				<li><strong>Antonyms</strong> — opposite meaning (hot, cold)</li>
				<li><strong>Hypernyms</strong> — more general (animal → dog)</li>
				<li><strong>Hyponyms</strong> — more specific (dog → poodle)</li>
				<li><strong>Derived from</strong> — morphological relationship</li>
			</ul>
		</section>
		
		<section id="scripts" class="guide-section">
			<h1>Writing Systems</h1>
			<p class="lead">
				Creating a writing system is optional but adds depth to your conlang. 
				There are several types to choose from.
			</p>
			
			<h2>Types of Writing Systems</h2>
			
			<div class="component-grid">
				<div class="component-card">
					<h4>Alphabet</h4>
					<p>Separate letters for consonants and vowels</p>
					<p><em>Latin, Greek, Cyrillic</em></p>
				</div>
				<div class="component-card">
					<h4>Abjad</h4>
					<p>Only consonants written; vowels implied or marked with diacritics</p>
					<p><em>Arabic, Hebrew</em></p>
				</div>
				<div class="component-card">
					<h4>Abugida</h4>
					<p>Consonant-vowel units; vowel shown by modifying consonant symbol</p>
					<p><em>Devanagari, Thai, Ethiopic</em></p>
				</div>
				<div class="component-card">
					<h4>Syllabary</h4>
					<p>One symbol per syllable</p>
					<p><em>Japanese kana, Cherokee</em></p>
				</div>
				<div class="component-card">
					<h4>Logographic</h4>
					<p>Symbols represent words or concepts</p>
					<p><em>Chinese hanzi, Egyptian hieroglyphs</em></p>
				</div>
				<div class="component-card">
					<h4>Featural</h4>
					<p>Symbol shapes encode phonetic features</p>
					<p><em>Korean hangul</em></p>
				</div>
			</div>
			
			<h2>Writing Direction</h2>
			<ul>
				<li><strong>Left to Right (LTR)</strong> — Latin, Greek, Cyrillic</li>
				<li><strong>Right to Left (RTL)</strong> — Arabic, Hebrew</li>
				<li><strong>Top to Bottom (TTB)</strong> — Traditional Chinese, Mongolian</li>
				<li><strong>Boustrophedon</strong> — alternating directions (ancient Greek)</li>
			</ul>
			
			<h2>Creating Glyphs</h2>
			<p>When designing symbols, consider:</p>
			<ul>
				<li><strong>Simplicity</strong> — can it be written quickly?</li>
				<li><strong>Distinctiveness</strong> — are similar sounds distinct enough?</li>
				<li><strong>Aesthetics</strong> — does it look good?</li>
				<li><strong>Internal logic</strong> — do related sounds have related shapes?</li>
			</ul>
			
			<h2>Romanization</h2>
			<p>
				Even with a unique script, you'll want a romanization system for practical use. 
				Define consistent rules for writing your language in Latin letters.
			</p>
		</section>
		
		<section id="texts" class="guide-section">
			<h1>Texts & Interlinear Glossing</h1>
			<p class="lead">
				Writing texts in your conlang brings it to life. Interlinear glossing helps you 
				(and others) understand the structure.
			</p>
			
			<h2>What is Interlinear Glossing?</h2>
			<p>
				An interlinear gloss shows each word broken down with its morphemes, their meanings, 
				and a translation. It's the standard format linguists use.
			</p>
			
			<div class="example-box interlinear-example">
				<div class="il-line">
					<div class="il-word">
						<span class="il-surface">talossa</span>
						<span class="il-gloss">house-INE</span>
					</div>
					<div class="il-word">
						<span class="il-surface">asuu</span>
						<span class="il-gloss">live-3SG</span>
					</div>
					<div class="il-word">
						<span class="il-surface">kissa</span>
						<span class="il-gloss">cat</span>
					</div>
				</div>
				<div class="il-translation">"The cat lives in the house"</div>
			</div>
			
			<h2>Leipzig Glossing Rules</h2>
			<p>
				The Leipzig Glossing Rules are the standard conventions. Key principles:
			</p>
			<ul>
				<li>Morpheme boundaries marked with hyphens: walk-ed</li>
				<li>Grammatical categories in SMALL CAPS: walk-PST</li>
				<li>Fused meanings joined with dots: 3SG.PRES</li>
				<li>Standard abbreviations for common categories</li>
			</ul>
			
			<h3>Common Abbreviations</h3>
			<table class="notation-table">
				<thead>
					<tr><th>Abbrev</th><th>Meaning</th><th>Abbrev</th><th>Meaning</th></tr>
				</thead>
				<tbody>
					<tr><td>1, 2, 3</td><td>Person</td><td>SG, PL, DU</td><td>Number</td></tr>
					<tr><td>NOM</td><td>Nominative</td><td>ACC</td><td>Accusative</td></tr>
					<tr><td>DAT</td><td>Dative</td><td>GEN</td><td>Genitive</td></tr>
					<tr><td>PST</td><td>Past</td><td>PRS</td><td>Present</td></tr>
					<tr><td>FUT</td><td>Future</td><td>PROG</td><td>Progressive</td></tr>
					<tr><td>PFV</td><td>Perfective</td><td>IPFV</td><td>Imperfective</td></tr>
					<tr><td>NEG</td><td>Negation</td><td>Q</td><td>Question</td></tr>
					<tr><td>DEF</td><td>Definite</td><td>INDEF</td><td>Indefinite</td></tr>
					<tr><td>M, F, N</td><td>Gender</td><td>CAUS</td><td>Causative</td></tr>
				</tbody>
			</table>
			
			<h2>Using the Texts Page</h2>
			<ol>
				<li>Create a new text with a title and optional source</li>
				<li>Enter the original text in your conlang</li>
				<li>Add a free translation</li>
				<li>Add interlinear lines for detailed glossing</li>
				<li>Export to LaTeX or HTML for sharing</li>
			</ol>
			
			<h2>Translation Exercises</h2>
			<p>Good texts to start with:</p>
			<ul>
				<li><strong>The North Wind and the Sun</strong> — classic linguistics text</li>
				<li><strong>Tower of Babel</strong> — shows off different grammatical features</li>
				<li><strong>Simple dialogues</strong> — greetings, introductions</li>
				<li><strong>Your own stories</strong> — most satisfying!</li>
			</ul>
		</section>
		
		<section id="tools" class="guide-section">
			<h1>Tools</h1>
			<p class="lead">
				Conlanger includes several tools to help you build and analyze your language.
			</p>
			
			<h2>Word Generator</h2>
			<p>
				Automatically creates words following your phonotactic rules.
			</p>
			<ol>
				<li>Set minimum and maximum syllable counts</li>
				<li>Define syllable structures (CV, CVC, etc.)</li>
				<li>Generate words</li>
				<li>Select the ones you like and add to lexicon</li>
			</ol>
			
			<h2>Sound Change Applier</h2>
			<p>
				Apply your sound change rules to words in bulk. Great for:
			</p>
			<ul>
				<li>Evolving a proto-language into daughter languages</li>
				<li>Seeing how words would change over time</li>
				<li>Testing sound change rules</li>
			</ul>
			
			<h2>Paradigm Generator</h2>
			<p>
				Enter a word stem and inflection class to see all its forms. 
				Useful for checking that your morphology is consistent.
			</p>
			
			<h2>Minimal Pairs Finder</h2>
			<p>
				Finds words in your lexicon that differ by only one sound. 
				Minimal pairs prove that two sounds are distinct phonemes.
			</p>
			
			<div class="example-box">
				<p><strong>Example:</strong> Finding minimal pairs for /p/ and /b/:</p>
				<ul>
					<li>pat ~ bat</li>
					<li>cap ~ cab</li>
				</ul>
				<p>These prove /p/ and /b/ are separate phonemes.</p>
			</div>
			
			<h2>Phonotactic Probability</h2>
			<p>
				Analyzes how "natural" a word sounds based on phoneme frequencies in your lexicon. 
				Higher scores mean the word uses common patterns.
			</p>
		</section>
		
		<div class="guide-footer">
			<h2>Ready to Start?</h2>
			<p>Now that you understand the basics, create your first language!</p>
			<a href="/" class="cta-button">Go to Languages</a>
		</div>
	</main>
</div>

<style>
	.guide-page {
		display: grid;
		grid-template-columns: 260px 1fr;
		min-height: 100vh;
	}
	
	.guide-nav {
		position: sticky;
		top: 0;
		height: 100vh;
		overflow-y: auto;
		padding: var(--space-6);
		background: var(--color-bg-secondary);
		border-right: 1px solid var(--color-border);
	}
	
	.nav-header {
		margin-bottom: var(--space-6);
	}
	
	.nav-header h2 {
		font-family: var(--font-serif);
		font-size: var(--size-lg);
		margin: 0 0 var(--space-1) 0;
	}
	
	.nav-header p {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}
	
	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-6) 0;
	}
	
	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
	}
	
	.nav-item:hover {
		background: var(--color-bg-hover);
		color: var(--color-text);
	}
	
	.nav-item.active {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		font-weight: 500;
	}
	
	.nav-icon {
		font-size: var(--size-md);
	}
	
	.back-link {
		display: block;
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.guide-content {
		padding: var(--space-8) var(--space-10);
		max-width: 900px;
	}
	
	.guide-section {
		margin-bottom: var(--space-12);
		padding-bottom: var(--space-12);
		border-bottom: 1px solid var(--color-border);
	}
	
	.guide-section:last-of-type {
		border-bottom: none;
	}
	
	.guide-section h1 {
		font-family: var(--font-serif);
		font-size: var(--size-3xl);
		font-weight: 500;
		margin: 0 0 var(--space-4) 0;
	}
	
	.guide-section h2 {
		font-family: var(--font-serif);
		font-size: var(--size-xl);
		font-weight: 500;
		margin: var(--space-8) 0 var(--space-3) 0;
	}
	
	.guide-section h3 {
		font-size: var(--size-md);
		font-weight: 600;
		margin: var(--space-6) 0 var(--space-2) 0;
	}
	
	.guide-section h4 {
		font-size: var(--size-sm);
		font-weight: 600;
		margin: var(--space-4) 0 var(--space-2) 0;
	}
	
	.lead {
		font-size: var(--size-lg);
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin-bottom: var(--space-6);
	}
	
	.guide-section p {
		line-height: 1.7;
		margin: 0 0 var(--space-4) 0;
	}
	
	.guide-section ul,
	.guide-section ol {
		margin: 0 0 var(--space-4) 0;
		padding-left: var(--space-6);
		line-height: 1.7;
	}
	
	.guide-section li {
		margin-bottom: var(--space-2);
	}
	
	.component-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--space-4);
		margin: var(--space-6) 0;
	}
	
	.component-card {
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.component-card h3,
	.component-card h4 {
		margin: 0 0 var(--space-2) 0;
	}
	
	.component-card p {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}
	
	.component-card p em {
		display: block;
		margin-top: var(--space-2);
		color: var(--color-text-tertiary);
	}
	
	.example-box {
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-left: 3px solid var(--color-accent);
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		margin: var(--space-4) 0;
	}
	
	.example-box p:last-child,
	.example-box ul:last-child {
		margin-bottom: 0;
	}
	
	.tip-box {
		padding: var(--space-4);
		background: var(--color-accent-light);
		border-radius: var(--radius-md);
		margin: var(--space-4) 0;
	}
	
	.tip-box .help-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: var(--color-accent);
		color: white;
		border-radius: 50%;
		font-size: 12px;
		font-weight: 600;
	}
	
	.question-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin: var(--space-4) 0;
	}
	
	.question {
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.question h4 {
		margin: 0 0 var(--space-2) 0;
	}
	
	.question p {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}
	
	.notation-table {
		width: 100%;
		border-collapse: collapse;
		margin: var(--space-4) 0;
		font-size: var(--size-sm);
	}
	
	.notation-table th,
	.notation-table td {
		padding: var(--space-2) var(--space-3);
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}
	
	.notation-table th {
		background: var(--color-bg-tertiary);
		font-weight: 600;
	}
	
	.notation-table code {
		background: var(--color-bg-tertiary);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-family: monospace;
	}
	
	.code-block {
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		font-family: monospace;
		overflow-x: auto;
		margin: var(--space-4) 0;
	}
	
	.interlinear-example {
		font-size: var(--size-md);
	}
	
	.il-line {
		display: flex;
		gap: var(--space-4);
		margin-bottom: var(--space-3);
	}
	
	.il-word {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.il-surface {
		font-weight: 500;
	}
	
	.il-gloss {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		font-family: monospace;
	}
	
	.il-translation {
		font-style: italic;
		color: var(--color-text-secondary);
	}
	
	.guide-footer {
		text-align: center;
		padding: var(--space-8);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-lg);
		margin-top: var(--space-8);
	}
	
	.guide-footer h2 {
		font-family: var(--font-serif);
		margin: 0 0 var(--space-2) 0;
	}
	
	.guide-footer p {
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-4) 0;
	}
	
	.cta-button {
		display: inline-block;
		padding: var(--space-3) var(--space-6);
		background: var(--color-text);
		color: var(--color-bg);
		border-radius: var(--radius-sm);
		font-weight: 500;
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.cta-button:hover {
		opacity: 0.9;
	}
	
	@media (max-width: 900px) {
		.guide-page {
			grid-template-columns: 1fr;
		}
		
		.guide-nav {
			position: static;
			height: auto;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
		}
		
		.nav-list {
			display: flex;
			flex-wrap: wrap;
			gap: var(--space-2);
		}
		
		.guide-content {
			padding: var(--space-6);
		}
	}
</style>
