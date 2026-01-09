<script lang="ts">
	import { Card, Button, Badge } from '$lib/components/ui';
	import { currentLanguage, languageStats } from '$lib/stores';
</script>

<div class="overview">
	{#if $currentLanguage}
		<div class="stats-grid">
			<Card title="Phonemes">
				<div class="stat">
					<span class="stat-value">{$currentLanguage.phonemes?.length ?? 0}</span>
					<span class="stat-label">Total phonemes</span>
				</div>
				<a href="/lang/{$currentLanguage.id}/phonology" class="card-link">
					Manage phonology
				</a>
			</Card>
			
			<Card title="Lexicon">
				<div class="stat">
					<span class="stat-value">{$currentLanguage.words?.length ?? 0}</span>
					<span class="stat-label">Words</span>
				</div>
				<a href="/lang/{$currentLanguage.id}/lexicon" class="card-link">
					Manage lexicon
				</a>
			</Card>
			
			<Card title="Morphology">
				<div class="stat">
					<span class="stat-value">{$currentLanguage.morphemes?.length ?? 0}</span>
					<span class="stat-label">Morphemes</span>
				</div>
				<a href="/lang/{$currentLanguage.id}/morphology" class="card-link">
					Manage morphology
				</a>
			</Card>
			
			<Card title="Scripts">
				<div class="stat">
					<span class="stat-value">{$currentLanguage.scripts?.length ?? 0}</span>
					<span class="stat-label">Writing systems</span>
				</div>
				<a href="/lang/{$currentLanguage.id}/scripts" class="card-link">
					Manage scripts
				</a>
			</Card>
		</div>
		
		<div class="info-section">
			<Card title="Language Info">
				<div class="info-grid">
					<div class="info-row">
						<span class="info-label">Name</span>
						<span class="info-value">{$currentLanguage.name}</span>
					</div>
					{#if $currentLanguage.nativeName}
						<div class="info-row">
							<span class="info-label">Native Name</span>
							<span class="info-value">{$currentLanguage.nativeName}</span>
						</div>
					{/if}
					{#if $currentLanguage.description}
						<div class="info-row">
							<span class="info-label">Description</span>
							<span class="info-value">{$currentLanguage.description}</span>
						</div>
					{/if}
					{#if $currentLanguage.settings}
						{#if $currentLanguage.settings.wordOrder}
							<div class="info-row">
								<span class="info-label">Word Order</span>
								<Badge label={$currentLanguage.settings.wordOrder as string} />
							</div>
						{/if}
						{#if $currentLanguage.settings.morphologicalType}
							<div class="info-row">
								<span class="info-label">Morphological Type</span>
								<Badge label={$currentLanguage.settings.morphologicalType as string} />
							</div>
						{/if}
					{/if}
				</div>
			</Card>
		</div>
		
		<div class="quick-actions">
			<Card title="Quick Actions">
				<div class="actions-grid">
					<a href="/lang/{$currentLanguage.id}/lexicon?add=true" class="action-item">
						<span class="action-icon">+</span>
						<span class="action-text">Add Word</span>
					</a>
					<a href="/lang/{$currentLanguage.id}/phonology?add=true" class="action-item">
						<span class="action-icon">+</span>
						<span class="action-text">Add Phoneme</span>
					</a>
					<a href="/lang/{$currentLanguage.id}/texts?add=true" class="action-item">
						<span class="action-icon">+</span>
						<span class="action-text">New Text</span>
					</a>
				</div>
			</Card>
		</div>
	{:else}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading language...</p>
		</div>
	{/if}
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}
	
	.stat {
		margin-bottom: var(--space-4);
	}
	
	.stat-value {
		display: block;
		font-size: var(--size-3xl);
		font-weight: 700;
		line-height: 1;
		margin-bottom: var(--space-1);
	}
	
	.stat-label {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
	}
	
	.card-link {
		font-size: var(--size-sm);
		color: var(--color-accent);
	}
	
	.info-section {
		margin-bottom: var(--space-6);
	}
	
	.info-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.info-row {
		display: flex;
		gap: var(--space-4);
	}
	
	.info-label {
		min-width: 140px;
		font-size: var(--size-sm);
		font-weight: 500;
		color: var(--color-text-secondary);
	}
	
	.info-value {
		font-size: var(--size-sm);
	}
	
	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: var(--space-3);
	}
	
	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text);
		transition: all var(--transition-fast);
	}
	
	.action-item:hover {
		background: var(--color-bg-hover);
	}
	
	.action-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--size-xl);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
	}
	
	.action-text {
		font-size: var(--size-sm);
		font-weight: 500;
	}
	
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-16);
		color: var(--color-text-secondary);
	}
	
	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: var(--space-4);
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
