<script lang="ts">
	import { Button } from '$lib/components/ui';
	import { isAuthenticated } from '$lib/convex';
	import { startAveLogin } from '$lib/auth/ave';
	import { goto } from '$app/navigation';
	
	function getStarted() {
		if ($isAuthenticated) {
			goto('/languages');
		} else {
			const redirectUri = `${window.location.origin}/callback`;
			startAveLogin(redirectUri);
		}
	}
</script>

<svelte:head>
	<title>Conlanger - Construct Languages with Precision</title>
	<meta name="description" content="The complete platform for creating constructed languages. Design phonologies, build lexicons, define grammars, and collaborate with others." />
</svelte:head>

<div class="home">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1 class="hero-title">
				Build languages<br />with intention
			</h1>
			<p class="hero-description">
				A complete toolkit for designing constructed languages. From phoneme inventories 
				to syntax rules, create languages that feel authentic and internally consistent.
			</p>
			<div class="hero-actions">
				<Button variant="primary" size="lg" onclick={getStarted}>
					Start Creating
				</Button>
				<a href="/guide" class="hero-link">
					Read the Guide
				</a>
			</div>
		</div>
	</section>
	
	<!-- Capabilities Section -->
	<section class="capabilities">
		<div class="capabilities-header">
			<h2>What you can build</h2>
			<p>Every component of a language, systematically organized.</p>
		</div>
		
		<div class="capability-grid">
			<div class="capability">
				<div class="capability-number">01</div>
				<h3>Phonology</h3>
				<p>Define consonants, vowels, and suprasegmentals. Set up allophonic rules, phonotactic constraints, and syllable structures.</p>
			</div>
			
			<div class="capability">
				<div class="capability-number">02</div>
				<h3>Morphology</h3>
				<p>Create grammatical categories like case, number, and tense. Define morphemes, affixes, and inflection paradigms.</p>
			</div>
			
			<div class="capability">
				<div class="capability-number">03</div>
				<h3>Syntax</h3>
				<p>Establish word order rules, phrase structures, and transformations. Document how sentences are constructed.</p>
			</div>
			
			<div class="capability">
				<div class="capability-number">04</div>
				<h3>Lexicon</h3>
				<p>Build your vocabulary with definitions, etymology, semantic fields, and relationships between words.</p>
			</div>
			
			<div class="capability">
				<div class="capability-number">05</div>
				<h3>Writing Systems</h3>
				<p>Design scripts from alphabets to logographies. Define glyphs, romanization rules, and rendering options.</p>
			</div>
			
			<div class="capability">
				<div class="capability-number">06</div>
				<h3>Texts</h3>
				<p>Write and translate texts with interlinear glossing. Build a corpus that demonstrates your language.</p>
			</div>
		</div>
	</section>
	
	<!-- Tools Section -->
	<section class="tools">
		<div class="tools-content">
			<div class="tools-text">
				<h2>Tools that accelerate your work</h2>
				<p>
					Beyond documentation, Conlanger provides computational tools 
					that help you generate, analyze, and evolve your language.
				</p>
			</div>
			<div class="tools-list">
				<div class="tool">
					<span class="tool-name">Word Generator</span>
					<span class="tool-desc">Create words that follow your phonotactic rules</span>
				</div>
				<div class="tool">
					<span class="tool-name">Sound Change Applier</span>
					<span class="tool-desc">Apply diachronic changes to evolve vocabulary</span>
				</div>
				<div class="tool">
					<span class="tool-name">Paradigm Generator</span>
					<span class="tool-desc">Auto-generate inflection tables</span>
				</div>
				<div class="tool">
					<span class="tool-name">Minimal Pairs Finder</span>
					<span class="tool-desc">Identify phonemic contrasts in your lexicon</span>
				</div>
				<div class="tool">
					<span class="tool-name">Interlinear Glosser</span>
					<span class="tool-desc">Create professional linguistic annotations</span>
				</div>
			</div>
		</div>
	</section>
	
	<!-- Collaboration Section -->
	<section class="collab">
		<div class="collab-content">
			<h2>Collaborate in real-time</h2>
			<p>
				Invite others to view or edit your languages. See who's working on what, 
				track changes, and build languages together.
			</p>
			<div class="collab-features">
				<div class="collab-feature">
					<span class="collab-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
					</span>
					<span>Multiple editors</span>
				</div>
				<div class="collab-feature">
					<span class="collab-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
						</svg>
					</span>
					<span>Activity tracking</span>
				</div>
				<div class="collab-feature">
					<span class="collab-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
					</span>
					<span>Live presence</span>
				</div>
			</div>
		</div>
	</section>
	
	<!-- Examples Section -->
	<section class="examples">
		<h2>See what others have built</h2>
		<p>Explore public languages created by the community.</p>
		<a href="/explore" class="examples-link">
			Browse Languages
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M5 12h14M12 5l7 7-7 7"/>
			</svg>
		</a>
	</section>
	
	<!-- CTA Section -->
	<section class="cta">
		<h2>Ready to begin?</h2>
		<p>Create your first language in minutes. Free to use.</p>
		<Button variant="primary" size="lg" onclick={getStarted}>
			Get Started
		</Button>
	</section>
</div>

<style>
	.home {
		overflow-x: hidden;
	}
	
	/* Hero Section */
	.hero {
		padding: var(--space-16) var(--space-8) var(--space-16);
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.hero-content {
		max-width: 700px;
	}
	
	.hero-title {
		font-size: clamp(2.5rem, 8vw, 4rem);
		font-weight: 500;
		line-height: 1.1;
		margin-bottom: var(--space-6);
		letter-spacing: -0.03em;
	}
	
	.hero-description {
		font-size: var(--size-lg);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-8);
		max-width: 560px;
		line-height: 1.6;
	}
	
	.hero-actions {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}
	
	.hero-link {
		color: var(--color-text-secondary);
		font-weight: 500;
		text-decoration: none;
		transition: color var(--transition-fast);
	}
	
	.hero-link:hover {
		color: var(--color-text);
		text-decoration: none;
	}
	
	/* Capabilities Section */
	.capabilities {
		padding: var(--space-16) var(--space-8);
		background: var(--color-bg-secondary);
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
	}
	
	.capabilities-header {
		max-width: 1000px;
		margin: 0 auto var(--space-12);
	}
	
	.capabilities-header h2 {
		font-size: var(--size-2xl);
		font-weight: 500;
		margin-bottom: var(--space-2);
	}
	
	.capabilities-header p {
		color: var(--color-text-secondary);
	}
	
	.capability-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-8);
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.capability {
		padding: var(--space-6) 0;
		border-top: 1px solid var(--color-border);
	}
	
	.capability-number {
		font-size: var(--size-xs);
		font-weight: 500;
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-4);
		font-family: var(--font-mono);
	}
	
	.capability h3 {
		font-size: var(--size-lg);
		font-weight: 500;
		margin-bottom: var(--space-2);
	}
	
	.capability p {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		line-height: 1.6;
	}
	
	/* Tools Section */
	.tools {
		padding: var(--space-16) var(--space-8);
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.tools-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-12);
		align-items: start;
	}
	
	.tools-text h2 {
		font-size: var(--size-2xl);
		font-weight: 500;
		margin-bottom: var(--space-4);
	}
	
	.tools-text p {
		color: var(--color-text-secondary);
		line-height: 1.6;
	}
	
	.tools-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.tool {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4) 0;
		border-bottom: 1px solid var(--color-border);
	}
	
	.tool:last-child {
		border-bottom: none;
	}
	
	.tool-name {
		font-weight: 500;
		font-size: var(--size-sm);
	}
	
	.tool-desc {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	/* Collaboration Section */
	.collab {
		padding: var(--space-16) var(--space-8);
		background: var(--color-bg-secondary);
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
	}
	
	.collab-content {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
	}
	
	.collab h2 {
		font-size: var(--size-2xl);
		font-weight: 500;
		margin-bottom: var(--space-4);
	}
	
	.collab > .collab-content > p {
		color: var(--color-text-secondary);
		margin-bottom: var(--space-8);
		line-height: 1.6;
	}
	
	.collab-features {
		display: flex;
		justify-content: center;
		gap: var(--space-8);
	}
	
	.collab-feature {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.collab-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
	}
	
	/* Examples Section */
	.examples {
		padding: var(--space-16) var(--space-8);
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
	}
	
	.examples h2 {
		font-size: var(--size-2xl);
		font-weight: 500;
		margin-bottom: var(--space-2);
	}
	
	.examples > p {
		color: var(--color-text-secondary);
		margin-bottom: var(--space-6);
	}
	
	.examples-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}
	
	.examples-link:hover {
		background: var(--color-bg-secondary);
		text-decoration: none;
	}
	
	/* CTA Section */
	.cta {
		padding: var(--space-16) var(--space-8);
		text-align: center;
		background: var(--color-bg-secondary);
		border-top: 1px solid var(--color-border);
	}
	
	.cta h2 {
		font-size: var(--size-2xl);
		font-weight: 500;
		margin-bottom: var(--space-2);
	}
	
	.cta > p {
		color: var(--color-text-secondary);
		margin-bottom: var(--space-6);
	}
	
	@media (max-width: 768px) {
		.hero {
			padding: var(--space-12) var(--space-6);
		}
		
		.hero-actions {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.capability-grid {
			grid-template-columns: 1fr;
		}
		
		.tools-content {
			grid-template-columns: 1fr;
		}
		
		.collab-features {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
