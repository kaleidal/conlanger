<script lang="ts">
	import { page } from '$app/stores';
	import { Card, Button, Input, Modal, Badge, Textarea, HelpTooltip } from '$lib/components/ui';
	import { currentLanguage } from '$lib/stores';
	
	const languageId = $derived($page.params.id);
	
	let selectedTextId = $state<string | null>(null);
	
	let textModalOpen = $state(false);
	let editingText = $state<Text | null>(null);
	let textForm = $state({
		title: '',
		originalText: '',
		translatedText: '',
		notes: '',
		source: ''
	});
	
	let interlinearModalOpen = $state(false);
	let editingLineIndex = $state<number | null>(null);
	let lineForm = $state({
		morphemes: '',
		translation: ''
	});
	
	let saving = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	
	interface InterlinearMorpheme {
		surface: string;
		underlying?: string;
		gloss: string;
		wordId?: string;
	}
	
	interface InterlinearData {
		morphemes: InterlinearMorpheme[];
		translation: string;
	}
	
	interface Text {
		id: string;
		title: string;
		originalText?: string;
		translatedText?: string;
		interlinearData?: InterlinearData[];
		notes?: string;
		source?: string;
		createdAt?: string;
		updatedAt?: string;
	}
	
	const texts = $derived(($currentLanguage?.texts ?? []) as Text[]);
	const selectedText = $derived(texts.find(t => t.id === selectedTextId));
	
	const words = $derived(($currentLanguage?.words ?? []) as { id: string; lemma: string; wordClass: string }[]);
	
	function openTextModal(text?: Text) {
		if (text) {
			editingText = text;
			textForm = {
				title: text.title,
				originalText: text.originalText ?? '',
				translatedText: text.translatedText ?? '',
				notes: text.notes ?? '',
				source: text.source ?? ''
			};
		} else {
			editingText = null;
			textForm = {
				title: '',
				originalText: '',
				translatedText: '',
				notes: '',
				source: ''
			};
		}
		textModalOpen = true;
	}
	
	async function saveText() {
		saving = true;
		try {
			const payload = {
				title: textForm.title,
				originalText: textForm.originalText || null,
				translatedText: textForm.translatedText || null,
				notes: textForm.notes || null,
				source: textForm.source || null,
				interlinearData: editingText?.interlinearData ?? null
			};
			
			if (editingText) {
				await fetch(`/api/languages/${languageId}/texts/${editingText.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				const response = await fetch(`/api/languages/${languageId}/texts`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				const newText = await response.json();
				selectedTextId = newText.id;
			}
			
			await currentLanguage.load(languageId);
			textModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteText(id: string) {
		await fetch(`/api/languages/${languageId}/texts/${id}`, { method: 'DELETE' });
		if (selectedTextId === id) {
			selectedTextId = texts.filter(t => t.id !== id)[0]?.id ?? null;
		}
		await currentLanguage.load(languageId);
		deleteConfirmId = null;
	}
	
	function openInterlinearModal(lineIndex?: number) {
		if (lineIndex !== undefined && selectedText?.interlinearData?.[lineIndex]) {
			editingLineIndex = lineIndex;
			const line = selectedText.interlinearData[lineIndex];
			lineForm = {
				morphemes: line.morphemes.map(m => `${m.surface}:${m.gloss}`).join(' '),
				translation: line.translation
			};
		} else {
			editingLineIndex = null;
			lineForm = {
				morphemes: '',
				translation: ''
			};
		}
		interlinearModalOpen = true;
	}
	
	function parseMorphemes(text: string): InterlinearMorpheme[] {
		return text.split(/\s+/)
			.filter(Boolean)
			.map(part => {
				const [surface, gloss] = part.split(':');
				return {
					surface: surface || '',
					gloss: gloss || surface || ''
				};
			});
	}
	
	async function saveInterlinearLine() {
		if (!selectedText) return;
		
		saving = true;
		try {
			const newLine: InterlinearData = {
				morphemes: parseMorphemes(lineForm.morphemes),
				translation: lineForm.translation
			};
			
			let updatedData = [...(selectedText.interlinearData ?? [])];
			
			if (editingLineIndex !== null) {
				updatedData[editingLineIndex] = newLine;
			} else {
				updatedData.push(newLine);
			}
			
			await fetch(`/api/languages/${languageId}/texts/${selectedText.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...selectedText,
					interlinearData: updatedData
				})
			});
			
			await currentLanguage.load(languageId);
			interlinearModalOpen = false;
		} finally {
			saving = false;
		}
	}
	
	async function deleteInterlinearLine(index: number) {
		if (!selectedText) return;
		
		const updatedData = selectedText.interlinearData?.filter((_, i) => i !== index) ?? [];
		
		await fetch(`/api/languages/${languageId}/texts/${selectedText.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...selectedText,
				interlinearData: updatedData
			})
		});
		
		await currentLanguage.load(languageId);
	}
	
	function exportAsLatex(): string {
		if (!selectedText?.interlinearData) return '';
		
		let latex = `\\documentclass{article}\n\\usepackage{expex}\n\\begin{document}\n\n`;
		latex += `\\section*{${selectedText.title}}\n\n`;
		
		selectedText.interlinearData.forEach((line, i) => {
			latex += `\\ex\n`;
			latex += `\\begingl\n`;
			latex += `\\gla ${line.morphemes.map(m => m.surface).join(' ')}//\n`;
			latex += `\\glb ${line.morphemes.map(m => m.gloss).join(' ')}//\n`;
			latex += `\\glft \\textit{${line.translation}}//\n`;
			latex += `\\endgl\n`;
			latex += `\\xe\n\n`;
		});
		
		latex += `\\end{document}`;
		return latex;
	}
	
	function exportAsHtml(): string {
		if (!selectedText?.interlinearData) return '';
		
		let html = `<!DOCTYPE html>\n<html><head><title>${selectedText.title}</title>\n`;
		html += `<style>
.interlinear { margin: 1em 0; }
.il-line { display: flex; gap: 1em; margin-bottom: 0.5em; }
.il-word { display: flex; flex-direction: column; align-items: center; }
.il-surface { font-weight: bold; }
.il-gloss { font-size: 0.8em; color: #666; }
.il-translation { font-style: italic; margin-top: 0.5em; }
</style></head><body>\n`;
		html += `<h1>${selectedText.title}</h1>\n`;
		
		selectedText.interlinearData.forEach(line => {
			html += `<div class="interlinear">\n`;
			html += `<div class="il-line">\n`;
			line.morphemes.forEach(m => {
				html += `<div class="il-word"><span class="il-surface">${m.surface}</span><span class="il-gloss">${m.gloss}</span></div>\n`;
			});
			html += `</div>\n`;
			html += `<div class="il-translation">"${line.translation}"</div>\n`;
			html += `</div>\n`;
		});
		
		html += `</body></html>`;
		return html;
	}
	
	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<div class="texts-page">
	<div class="page-header">
		<h2>Texts & Translation</h2>
		<Button variant="primary" onclick={() => openTextModal()}>Add Text</Button>
	</div>
	
	<div class="texts-layout">
		<div class="texts-sidebar">
			<Card title="Texts" padding={false}>
				<div class="text-list">
					{#each texts as text}
						<button 
							class="text-item" 
							class:selected={selectedTextId === text.id}
							onclick={() => selectedTextId = text.id}
						>
							<span class="text-title">{text.title}</span>
							{#if text.source}
								<span class="text-source">{text.source}</span>
							{/if}
						</button>
					{:else}
						<p class="empty-sidebar">No texts yet. Click "Add Text" to create one.</p>
					{/each}
				</div>
			</Card>
		</div>
		
		<div class="texts-content">
			{#if selectedText}
				<Card>
					<div class="text-header">
						<h3 class="text-title-large">{selectedText.title}</h3>
						<div class="text-actions">
							<Button size="sm" variant="ghost" onclick={() => openTextModal(selectedText)}>Edit</Button>
							<Button size="sm" variant="ghost" onclick={() => deleteConfirmId = selectedText.id}>Delete</Button>
						</div>
					</div>
					
					{#if selectedText.source}
						<div class="text-meta">
							<span class="meta-label">Source:</span> {selectedText.source}
						</div>
					{/if}
					
					{#if selectedText.originalText}
						<div class="text-section">
							<h4>Original Text</h4>
							<p class="original-text">{selectedText.originalText}</p>
						</div>
					{/if}
					
					{#if selectedText.translatedText}
						<div class="text-section">
							<h4>Translation</h4>
							<p class="translated-text">{selectedText.translatedText}</p>
						</div>
					{/if}
					
					{#if selectedText.notes}
						<div class="text-section">
							<h4>Notes</h4>
							<p class="text-notes">{selectedText.notes}</p>
						</div>
					{/if}
				</Card>
				
				<Card>
					<div class="interlinear-header">
						<h4>Interlinear Gloss</h4>
						<div class="interlinear-actions">
							<Button size="sm" variant="ghost" onclick={() => copyToClipboard(exportAsLatex())}>
								Export LaTeX
							</Button>
							<Button size="sm" variant="ghost" onclick={() => copyToClipboard(exportAsHtml())}>
								Export HTML
							</Button>
							<Button size="sm" variant="primary" onclick={() => openInterlinearModal()}>
								Add Line
							</Button>
						</div>
					</div>
					
					<div class="interlinear-content">
						{#each selectedText.interlinearData ?? [] as line, index}
							<div class="interlinear-line">
								<div class="il-number">{index + 1}.</div>
								<div class="il-body">
									<div class="il-morphemes">
										{#each line.morphemes as morpheme}
											<div class="il-word">
												<span class="il-surface">{morpheme.surface}</span>
												<span class="il-gloss">{morpheme.gloss}</span>
											</div>
										{/each}
									</div>
									<div class="il-translation">"{line.translation}"</div>
								</div>
								<div class="il-actions">
									<Button size="sm" variant="ghost" onclick={() => openInterlinearModal(index)}>Edit</Button>
									<Button size="sm" variant="ghost" onclick={() => deleteInterlinearLine(index)}>Delete</Button>
								</div>
							</div>
						{:else}
							<p class="empty-interlinear">No interlinear data yet. Click "Add Line" to begin glossing.</p>
						{/each}
					</div>
				</Card>
				
				<Card title="Leipzig Glossing Abbreviations">
					<div class="abbreviations-grid">
						<div class="abbrev-item"><code>1</code> first person</div>
						<div class="abbrev-item"><code>2</code> second person</div>
						<div class="abbrev-item"><code>3</code> third person</div>
						<div class="abbrev-item"><code>SG</code> singular</div>
						<div class="abbrev-item"><code>PL</code> plural</div>
						<div class="abbrev-item"><code>DU</code> dual</div>
						<div class="abbrev-item"><code>NOM</code> nominative</div>
						<div class="abbrev-item"><code>ACC</code> accusative</div>
						<div class="abbrev-item"><code>DAT</code> dative</div>
						<div class="abbrev-item"><code>GEN</code> genitive</div>
						<div class="abbrev-item"><code>PST</code> past</div>
						<div class="abbrev-item"><code>PRS</code> present</div>
						<div class="abbrev-item"><code>FUT</code> future</div>
						<div class="abbrev-item"><code>PROG</code> progressive</div>
						<div class="abbrev-item"><code>PFV</code> perfective</div>
						<div class="abbrev-item"><code>IPFV</code> imperfective</div>
						<div class="abbrev-item"><code>NEG</code> negation</div>
						<div class="abbrev-item"><code>Q</code> question</div>
						<div class="abbrev-item"><code>DEF</code> definite</div>
						<div class="abbrev-item"><code>INDEF</code> indefinite</div>
					</div>
				</Card>
			{:else}
				<Card>
					<p class="empty-content">
						{#if texts.length > 0}
							Select a text from the sidebar to view and edit it.
						{:else}
							No texts yet. Click "Add Text" to create your first text entry.
						{/if}
					</p>
				</Card>
			{/if}
		</div>
	</div>
</div>

<Modal 
	bind:open={textModalOpen} 
	title={editingText ? 'Edit Text' : 'Add Text'}
	size="lg"
	onclose={() => textModalOpen = false}
>
	<div class="form">
		<div class="form-group">
			<label for="text-title">Title <HelpTooltip key="textTitle" inline /></label>
			<Input id="text-title" bind:value={textForm.title} placeholder="e.g. The North Wind and the Sun" />
		</div>
		
		<div class="form-group">
			<label for="text-source">Source (optional) <HelpTooltip key="textSource" inline /></label>
			<Input id="text-source" bind:value={textForm.source} placeholder="e.g. Aesop's Fables" />
		</div>
		
		<div class="form-group">
			<label for="text-original">Original Text <HelpTooltip key="textOriginal" inline /></label>
			<Textarea 
				id="text-original" 
				bind:value={textForm.originalText} 
				placeholder="The text in your conlang..."
				rows={5}
			/>
		</div>
		
		<div class="form-group">
			<label for="text-translated">Translation <HelpTooltip key="textTranslation" inline /></label>
			<Textarea 
				id="text-translated" 
				bind:value={textForm.translatedText} 
				placeholder="Translation into English or another language..."
				rows={5}
			/>
		</div>
		
		<div class="form-group">
			<label for="text-notes">Notes <HelpTooltip key="textNotes" inline /></label>
			<Textarea 
				id="text-notes" 
				bind:value={textForm.notes} 
				placeholder="Any additional notes about this text..."
				rows={3}
			/>
		</div>
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => textModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveText} loading={saving} disabled={!textForm.title}>
			{editingText ? 'Update' : 'Add'} Text
		</Button>
	{/snippet}
</Modal>

<Modal 
	bind:open={interlinearModalOpen} 
	title={editingLineIndex !== null ? 'Edit Interlinear Line' : 'Add Interlinear Line'}
	size="lg"
	onclose={() => interlinearModalOpen = false}
>
	<div class="form">
		<div class="form-group">
			<label for="il-morphemes">Morphemes (format: surface:gloss, space-separated) <HelpTooltip key="ilMorphemes" inline /></label>
			<Textarea 
				id="il-morphemes" 
				bind:value={lineForm.morphemes} 
				placeholder="talo-ssa:house-INE asu-u:live-3SG kissa:cat"
				rows={3}
			/>
			<span class="form-hint">
				Enter each morpheme as surface:gloss. Use hyphens within morphemes to show segmentation.
				Examples: talo:house, -ssa:-INE, asu-u:live-3SG
			</span>
		</div>
		
		<div class="form-group">
			<label for="il-translation">Free Translation <HelpTooltip key="ilTranslation" inline /></label>
			<Input 
				id="il-translation" 
				bind:value={lineForm.translation} 
				placeholder="The cat lives in the house." 
			/>
		</div>
		
		{#if lineForm.morphemes}
			<div class="form-group">
				<span class="form-label">Preview</span>
				<div class="il-preview">
					<div class="il-morphemes preview">
						{#each parseMorphemes(lineForm.morphemes) as morpheme}
							<div class="il-word">
								<span class="il-surface">{morpheme.surface}</span>
								<span class="il-gloss">{morpheme.gloss}</span>
							</div>
						{/each}
					</div>
					{#if lineForm.translation}
						<div class="il-translation preview">"{lineForm.translation}"</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => interlinearModalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={saveInterlinearLine} loading={saving} disabled={!lineForm.morphemes}>
			{editingLineIndex !== null ? 'Update' : 'Add'} Line
		</Button>
	{/snippet}
</Modal>

<Modal 
	open={deleteConfirmId !== null}
	title="Confirm Delete"
	size="sm"
	onclose={() => deleteConfirmId = null}
>
	<p>Are you sure you want to delete this text? This action cannot be undone.</p>
	
	{#snippet footer()}
		<Button variant="secondary" onclick={() => deleteConfirmId = null}>Cancel</Button>
		<Button variant="danger" onclick={() => deleteConfirmId && deleteText(deleteConfirmId)}>Delete</Button>
	{/snippet}
</Modal>

<style>
	.texts-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.page-header h2 {
		font-size: var(--size-xl);
		font-weight: 600;
		margin: 0;
	}
	
	.texts-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: var(--space-6);
	}
	
	.texts-sidebar {
		position: sticky;
		top: var(--space-4);
		align-self: start;
	}
	
	.text-list {
		display: flex;
		flex-direction: column;
	}
	
	.text-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-4);
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
		border-bottom: 1px solid var(--color-border);
	}
	
	.text-item:hover {
		background: var(--color-bg-hover);
	}
	
	.text-item.selected {
		background: var(--color-bg-tertiary);
	}
	
	.text-item .text-title {
		font-weight: 500;
	}
	
	.text-item .text-source {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
	}
	
	.texts-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.text-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4);
	}
	
	.text-title-large {
		font-size: var(--size-lg);
		font-weight: 600;
		margin: 0;
	}
	
	.text-actions {
		display: flex;
		gap: var(--space-1);
	}
	
	.text-meta {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-4);
	}
	
	.meta-label {
		font-weight: 500;
	}
	
	.text-section {
		margin-bottom: var(--space-4);
	}
	
	.text-section h4 {
		font-size: var(--size-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 var(--space-2) 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.original-text {
		font-size: var(--size-lg);
		line-height: 1.6;
		margin: 0;
	}
	
	.translated-text {
		font-style: italic;
		color: var(--color-text-secondary);
		margin: 0;
	}
	
	.text-notes {
		font-size: var(--size-sm);
		color: var(--color-text-secondary);
		margin: 0;
	}
	
	.interlinear-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-4);
	}
	
	.interlinear-header h4 {
		font-size: var(--size-md);
		font-weight: 600;
		margin: 0;
	}
	
	.interlinear-actions {
		display: flex;
		gap: var(--space-2);
	}
	
	.interlinear-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.interlinear-line {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.il-number {
		font-size: var(--size-sm);
		color: var(--color-text-tertiary);
		min-width: 24px;
	}
	
	.il-body {
		flex: 1;
	}
	
	.il-morphemes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-bottom: var(--space-2);
	}
	
	.il-word {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.il-surface {
		font-weight: 500;
		font-size: var(--size-md);
	}
	
	.il-gloss {
		font-size: var(--size-xs);
		color: var(--color-text-secondary);
		font-family: monospace;
	}
	
	.il-translation {
		font-style: italic;
		color: var(--color-text-secondary);
	}
	
	.il-actions {
		display: flex;
		gap: var(--space-1);
	}
	
	.il-preview {
		padding: var(--space-4);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}
	
	.il-morphemes.preview {
		gap: var(--space-3);
	}
	
	.il-translation.preview {
		margin-top: var(--space-3);
	}
	
	.abbreviations-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: var(--space-2);
		font-size: var(--size-sm);
	}
	
	.abbrev-item {
		display: flex;
		gap: var(--space-2);
	}
	
	.abbrev-item code {
		background: var(--color-bg-tertiary);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
		font-family: monospace;
		font-weight: 500;
	}
	
	.empty-sidebar,
	.empty-content,
	.empty-interlinear {
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--space-6);
		font-size: var(--size-sm);
	}
	
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.form-group label,
	.form-group .form-label {
		font-size: var(--size-sm);
		font-weight: 500;
	}
	
	.form-hint {
		font-size: var(--size-xs);
		color: var(--color-text-tertiary);
	}
	
	@media (max-width: 768px) {
		.texts-layout {
			grid-template-columns: 1fr;
		}
		
		.texts-sidebar {
			position: static;
		}
	}
</style>
