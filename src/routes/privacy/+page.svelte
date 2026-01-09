<script lang="ts">
</script>

<svelte:head>
	<title>Privacy Policy - Conlanger</title>
</svelte:head>

<div class="legal-page">
	<h1>Privacy Policy</h1>
	<p class="last-updated">Last updated: January 9, 2026</p>
	
	<section>
		<h2>Introduction</h2>
		<p>
			Conlanger ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
			explains how we collect, use, disclose, and safeguard your information when you use our 
			constructed language creation platform.
		</p>
	</section>
	
	<section>
		<h2>Information We Collect</h2>
		
		<h3>Account Information</h3>
		<p>
			When you sign in through Ave, we receive and store the following information from your 
			Ave identity:
		</p>
		<ul>
			<li>Your Ave identity ID (a unique identifier)</li>
			<li>Your display name</li>
			<li>Your handle (username)</li>
			<li>Your email address (if provided)</li>
			<li>Your avatar image URL (if provided)</li>
		</ul>
		
		<h3>Language Data</h3>
		<p>
			We store all data you create within Conlanger, including:
		</p>
		<ul>
			<li>Language names, descriptions, and settings</li>
			<li>Phoneme inventories, allophones, and phonotactic rules</li>
			<li>Words, definitions, etymologies, and relationships</li>
			<li>Grammar categories, morphemes, and inflection paradigms</li>
			<li>Syntax rules and examples</li>
			<li>Scripts, glyphs, and romanization rules</li>
			<li>Texts and interlinear glosses</li>
		</ul>
		
		<h3>Usage Data</h3>
		<p>
			We automatically collect certain information when you use Conlanger:
		</p>
		<ul>
			<li>Activity logs (what you create, edit, or delete)</li>
			<li>Presence information for real-time collaboration</li>
			<li>Session information for authentication</li>
		</ul>
	</section>
	
	<section>
		<h2>How We Use Your Information</h2>
		<p>We use the collected information to:</p>
		<ul>
			<li>Provide and maintain the Conlanger service</li>
			<li>Enable real-time collaboration features</li>
			<li>Associate your languages with your account</li>
			<li>Display your identity to collaborators</li>
			<li>Improve and optimize our platform</li>
			<li>Respond to your requests and support inquiries</li>
		</ul>
	</section>
	
	<section>
		<h2>Data Sharing</h2>
		<p>
			We do not sell, trade, or rent your personal information to third parties. We may share 
			information in the following limited circumstances:
		</p>
		<ul>
			<li>
				<strong>Public Languages:</strong> If you make a language public, its contents will be 
				visible to all users, along with your display name as the creator.
			</li>
			<li>
				<strong>Collaborators:</strong> When you add collaborators to a language, they can see 
				your display name, handle, and avatar as the owner.
			</li>
			<li>
				<strong>Legal Requirements:</strong> We may disclose information if required by law or 
				in response to valid legal processes.
			</li>
		</ul>
	</section>
	
	<section>
		<h2>Data Storage and Security</h2>
		<p>
			Your data is stored securely using Convex, a real-time database platform. We implement 
			appropriate technical and organizational measures to protect your data against unauthorized 
			access, alteration, disclosure, or destruction.
		</p>
	</section>
	
	<section>
		<h2>Your Rights</h2>
		<p>You have the right to:</p>
		<ul>
			<li>Access your personal data</li>
			<li>Correct inaccurate data</li>
			<li>Delete your account and associated data</li>
			<li>Export your language data</li>
			<li>Withdraw consent for data processing</li>
		</ul>
		<p>
			To exercise these rights, please contact us using the information provided below.
		</p>
	</section>
	
	<section>
		<h2>Data Retention</h2>
		<p>
			We retain your data for as long as your account is active. If you delete your account, 
			we will delete your personal information and languages within 30 days, unless we are 
			required to retain it for legal purposes.
		</p>
	</section>
	
	<section>
		<h2>Third-Party Services</h2>
		<p>
			We use the following third-party services:
		</p>
		<ul>
			<li><strong>Ave:</strong> For authentication. See <a href="https://aveid.net/privacy">Ave's Privacy Policy</a>.</li>
			<li><strong>Convex:</strong> For data storage and real-time sync. See <a href="https://convex.dev/privacy">Convex's Privacy Policy</a>.</li>
		</ul>
	</section>
	
	<section>
		<h2>Children's Privacy</h2>
		<p>
			Conlanger is not intended for children under 13 years of age. We do not knowingly collect 
			personal information from children under 13.
		</p>
	</section>
	
	<section>
		<h2>Changes to This Policy</h2>
		<p>
			We may update this Privacy Policy from time to time. We will notify you of any changes by 
			posting the new Privacy Policy on this page and updating the "Last updated" date.
		</p>
	</section>
	
	<section>
		<h2>Contact Us</h2>
		<p>
			If you have any questions about this Privacy Policy, please contact us at 
			<a href="mailto:privacy@conlanger.com">privacy@conlanger.com</a>.
		</p>
	</section>
</div>

<style>
	.legal-page {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-12) var(--space-8);
	}
	
	h1 {
		font-size: var(--size-3xl);
		margin-bottom: var(--space-2);
	}
	
	.last-updated {
		color: var(--color-text-secondary);
		font-size: var(--size-sm);
		margin-bottom: var(--space-12);
	}
	
	section {
		margin-bottom: var(--space-10);
	}
	
	h2 {
		font-size: var(--size-xl);
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-border);
	}
	
	h3 {
		font-size: var(--size-lg);
		margin-top: var(--space-6);
		margin-bottom: var(--space-2);
	}
	
	p {
		margin-bottom: var(--space-4);
		line-height: 1.7;
	}
	
	ul {
		margin-bottom: var(--space-4);
		padding-left: var(--space-6);
	}
	
	li {
		margin-bottom: var(--space-2);
		line-height: 1.6;
	}
	
	a {
		color: var(--color-accent);
	}
</style>
