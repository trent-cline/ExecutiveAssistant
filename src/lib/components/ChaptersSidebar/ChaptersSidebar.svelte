# svelte-file
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { supabase } from '$lib/supabase';
    import RichTextEditor from '$lib/components/RichTextEditor/RichTextEditor.svelte';

    export let userId: string;
    export let selectedChapterId: string | null = null;

    interface Chapter {
        id: string;
        title: string;
        content: string;
        order_index: number;
        created_at: string;
    }

    const dispatch = createEventDispatcher();
    let chapters: Chapter[] = [];
    let loading = true;
    let error = '';
    let newChapterTitle = '';
    let chapterContent = '';
    let editingChapter = false;
    let selectedChapter: Chapter | null = null;
    let editingTitle = false;
    let draggedChapter: Chapter | null = null;

    $: {
        if (selectedChapterId) {
            selectedChapter = chapters.find(c => c.id === selectedChapterId) || null;
            if (selectedChapter) {
                chapterContent = selectedChapter.content;
            }
        } else {
            selectedChapter = null;
            chapterContent = '';
        }
    }

    async function loadChapters() {
        try {
            const { data, error: err } = await supabase
                .from('dlltw_chapters')
                .select('*')
                .order('order_index', { ascending: true });

            if (err) throw err;
            chapters = data || [];
            loading = false;
        } catch (e) {
            console.error('Error loading chapters:', e);
            error = 'Failed to load chapters';
            loading = false;
        }
    }

    async function createChapter() {
        if (!newChapterTitle || !userId) return;

        try {
            const nextIndex = chapters.length;
            const { data, error: err } = await supabase
                .from('dlltw_chapters')
                .insert([{
                    title: newChapterTitle,
                    content: '',
                    order_index: nextIndex,
                    user_id: userId
                }])
                .select();

            if (err) throw err;
            newChapterTitle = '';
            await loadChapters();
        } catch (err) {
            console.error('Error creating chapter:', err);
            error = 'Failed to create chapter';
        }
    }

    async function updateChapterContent() {
        if (!selectedChapter || !userId) return;

        try {
            const { error: err } = await supabase
                .from('dlltw_chapters')
                .update({
                    content: chapterContent
                })
                .eq('id', selectedChapter.id);

            if (err) throw err;
            editingChapter = false;
            await loadChapters();
        } catch (err) {
            console.error('Error updating chapter:', err);
            error = 'Failed to update chapter';
        }
    }

    async function updateChapterTitle(chapter: Chapter, newTitle: string) {
        if (!userId) return;

        try {
            const { error: err } = await supabase
                .from('dlltw_chapters')
                .update({
                    title: newTitle
                })
                .eq('id', chapter.id);

            if (err) throw err;
            editingTitle = false;
            await loadChapters();
        } catch (err) {
            console.error('Error updating chapter title:', err);
            error = 'Failed to update chapter title';
        }
    }

    async function deleteChapter(chapter: Chapter) {
        if (!confirm(`Are you sure you want to delete "${chapter.title}"? This will not delete the notes in this chapter.`)) return;

        try {
            const { error: err } = await supabase
                .from('dlltw_chapters')
                .delete()
                .eq('id', chapter.id);

            if (err) throw err;

            // Update order_index for remaining chapters
            const remainingChapters = chapters.filter(c => c.id !== chapter.id);
            await Promise.all(remainingChapters.map((c, index) => 
                supabase
                    .from('dlltw_chapters')
                    .update({ order_index: index })
                    .eq('id', c.id)
            ));

            if (selectedChapter?.id === chapter.id) {
                selectedChapter = null;
                dispatch('select', { id: null });
            }
            await loadChapters();
        } catch (err) {
            console.error('Error deleting chapter:', err);
            error = 'Failed to delete chapter';
        }
    }

    async function reorderChapters(fromIndex: number, toIndex: number) {
        const updatedChapters = [...chapters];
        const [movedChapter] = updatedChapters.splice(fromIndex, 1);
        updatedChapters.splice(toIndex, 0, movedChapter);

        try {
            await Promise.all(updatedChapters.map((chapter, index) => 
                supabase
                    .from('dlltw_chapters')
                    .update({ order_index: index })
                    .eq('id', chapter.id)
            ));
            await loadChapters();
        } catch (err) {
            console.error('Error reordering chapters:', err);
            error = 'Failed to reorder chapters';
        }
    }

    function selectChapter(chapter: Chapter) {
        selectedChapter = chapter;
        chapterContent = chapter.content;
        editingChapter = false;
        dispatch('select', { id: chapter.id });
    }

    function handleEditorUpdate(content: string) {
        chapterContent = content;
    }

    function handleDragStart(chapter: Chapter, e: DragEvent) {
        draggedChapter = chapter;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    function handleDrop(targetChapter: Chapter) {
        if (!draggedChapter || draggedChapter.id === targetChapter.id) return;

        const fromIndex = chapters.findIndex(c => c.id === draggedChapter?.id);
        const toIndex = chapters.findIndex(c => c.id === targetChapter.id);
        reorderChapters(fromIndex, toIndex);
        draggedChapter = null;
    }

    $: {
        if (userId) {
            loadChapters();
        }
    }
</script>

<div class="chapters-sidebar">
    <div class="chapter-header">
        <h2>Chapters</h2>
        <div class="new-chapter">
            <input 
                type="text" 
                bind:value={newChapterTitle}
                placeholder="New chapter title..."
                class="chapter-input"
            />
            <button 
                class="add-chapter" 
                on:click={createChapter}
                disabled={!newChapterTitle}
            >
                Add
            </button>
        </div>
    </div>

    <div class="chapters-list">
        {#if loading}
            <div class="loading">Loading chapters...</div>
        {:else if error}
            <div class="error">{error}</div>
        {:else}
            {#each chapters as chapter (chapter.id)}
                <div 
                    class="chapter-item"
                    class:active={selectedChapter?.id === chapter.id}
                    draggable="true"
                    on:dragstart={(e) => handleDragStart(chapter, e)}
                    on:dragover={handleDragOver}
                    on:drop={() => handleDrop(chapter)}
                >
                    <div class="chapter-content" on:click={() => selectChapter(chapter)}>
                        {#if editingTitle && selectedChapter?.id === chapter.id}
                            <input 
                                type="text" 
                                value={chapter.title}
                                on:blur={(e) => updateChapterTitle(chapter, e.target.value)}
                                on:keydown={(e) => e.key === 'Enter' && updateChapterTitle(chapter, e.target.value)}
                                class="title-input"
                            />
                        {:else}
                            <span class="chapter-title">
                                <span class="material-icons drag-handle">drag_indicator</span>
                                {chapter.title}
                            </span>
                        {/if}
                        <span class="note-count">
                            <slot name="note-count" {chapter}>
                                0 notes
                            </slot>
                        </span>
                    </div>
                    <div class="chapter-actions">
                        <button 
                            class="action-button"
                            on:click={() => editingTitle = !editingTitle}
                            title="Rename chapter"
                        >
                            <span class="material-icons">edit</span>
                        </button>
                        <button 
                            class="action-button"
                            on:click={() => deleteChapter(chapter)}
                            title="Delete chapter"
                        >
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    {#if selectedChapter}
        <div class="chapter-content">
            <div class="chapter-content-header">
                <h3>{selectedChapter.title}</h3>
                <button 
                    class="edit-button"
                    on:click={() => editingChapter = !editingChapter}
                >
                    <span class="material-icons">
                        {editingChapter ? 'close' : 'edit'}
                    </span>
                </button>
            </div>
            
            {#if editingChapter}
                <div class="chapter-editor">
                    <RichTextEditor
                        content={chapterContent}
                        placeholder="Write chapter content..."
                        onUpdate={handleEditorUpdate}
                    />
                    <div class="editor-actions">
                        <button 
                            class="save-button" 
                            on:click={updateChapterContent}
                        >
                            Save Chapter
                        </button>
                    </div>
                </div>
            {:else}
                <div class="chapter-content-view">
                    {@html chapterContent}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .chapters-sidebar {
        width: 300px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        height: calc(100vh - 2rem);
        position: sticky;
        top: 1rem;
    }

    .chapter-header {
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .chapter-header h2 {
        margin: 0 0 1rem 0;
        color: #2d3748;
    }

    .new-chapter {
        display: flex;
        gap: 0.5rem;
    }

    .chapter-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .add-chapter {
        padding: 0.5rem 1rem;
        background: #4299e1;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
    }

    .add-chapter:disabled {
        background: #a0aec0;
        cursor: not-allowed;
    }

    .chapters-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
    }

    .chapter-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
        border: 2px solid transparent;
    }

    .chapter-item:hover {
        background: #f7fafc;
    }

    .chapter-item.active {
        background: #ebf8ff;
        color: #2b6cb0;
    }

    .chapter-item.dragging {
        opacity: 0.5;
    }

    .chapter-item.drag-over {
        border: 2px dashed #4299e1;
    }

    .chapter-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }

    .chapter-title {
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .drag-handle {
        color: #a0aec0;
        font-size: 1.25rem;
        cursor: grab;
    }

    .drag-handle:active {
        cursor: grabbing;
    }

    .title-input {
        width: 100%;
        padding: 0.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .note-count {
        font-size: 0.75rem;
        color: #718096;
        white-space: nowrap;
    }

    .chapter-actions {
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .chapter-item:hover .chapter-actions {
        opacity: 1;
    }

    .action-button {
        background: transparent;
        border: none;
        color: #718096;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .action-button:hover {
        background: #edf2f7;
        color: #4a5568;
    }

    .chapter-content {
        padding: 1rem;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
    }

    .chapter-content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .chapter-content-header h3 {
        margin: 0;
        color: #2d3748;
    }

    .edit-button {
        background: transparent;
        border: none;
        color: #4a5568;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s;
    }

    .edit-button:hover {
        background: #edf2f7;
    }

    .chapter-content-view {
        color: #4a5568;
        line-height: 1.5;
    }

    .chapter-editor {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .loading {
        padding: 1rem;
        color: #718096;
        text-align: center;
    }

    .error {
        padding: 1rem;
        color: #e53e3e;
        text-align: center;
    }

    @media (max-width: 768px) {
        .chapters-sidebar {
            width: 100%;
            height: auto;
            position: static;
        }
    }
</style>
