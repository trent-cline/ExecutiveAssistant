<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import RichTextEditor from '$lib/components/RichTextEditor/RichTextEditor.svelte';
    import ChaptersSidebar from '$lib/components/ChaptersSidebar/ChaptersSidebar.svelte';

    interface DLLTWNote {
        id: string;
        name: string;
        summary: string;
        content: string;
        status: 'Not Started' | 'In Progress' | 'Done';
        priority: 'Low' | 'Medium' | 'High';
        category: 'Note' | 'Task' | 'Reminder';
        chapter_id: string | null;
        tags: string[];
        created_at: string;
    }

    let notes: DLLTWNote[] = [];
    let loading = true;
    let error = '';
    let editingNote: DLLTWNote | null = null;
    let searchQuery = '';
    let selectedChapterId: string | null = null;
    let selectedTag = '';
    let newNoteContent = '';

    onMount(async () => {
        if (!$user) {
            goto('/login');
            return;
        }
        
        await loadNotes();
    });

    async function loadNotes() {
        try {
            const { data, error: err } = await supabase
                .from('dlltw_notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            notes = data || [];
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function startEditing(note: DLLTWNote) {
        editingNote = { ...note };
    }

    async function saveNote() {
        if (!editingNote) return;

        try {
            const { error: err } = await supabase
                .from('dlltw_notes')
                .update({
                    name: editingNote.name,
                    summary: editingNote.summary,
                    content: editingNote.content,
                    chapter_id: editingNote.chapter_id,
                    tags: editingNote.tags
                })
                .eq('id', editingNote.id);

            if (err) throw err;
            
            notes = notes.map(n => n.id === editingNote.id ? editingNote : n);
            editingNote = null;
        } catch (e) {
            error = e.message;
        }
    }

    async function deleteNote(id: string) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            const { error: err } = await supabase
                .from('dlltw_notes')
                .delete()
                .eq('id', id);

            if (err) throw err;
            notes = notes.filter(n => n.id !== id);
        } catch (e) {
            error = e.message;
        }
    }

    function filterNotes(notes: DLLTWNote[]) {
        return notes.filter(note => {
            const matchesSearch = searchQuery === '' || 
                note.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.summary?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesChapter = !selectedChapterId || note.chapter_id === selectedChapterId;
            const matchesTag = selectedTag === '' || note.tags?.includes(selectedTag);

            return matchesSearch && matchesChapter && matchesTag;
        });
    }

    function getPriorityClass(priority: string) {
        return priority.toLowerCase();
    }

    function getStatusClass(status: string) {
        return status.toLowerCase().replace(' ', '-');
    }

    async function saveNewNote() {
        if (!newNoteContent || !$user?.id) return;

        try {
            const { data, error: err } = await supabase
                .from('dlltw_notes')
                .insert([{
                    name: 'New Note',
                    content: newNoteContent,
                    status: 'Not Started',
                    priority: 'Medium',
                    category: 'Note',
                    chapter_id: selectedChapterId,
                    created_at: new Date().toISOString(),
                    user_id: $user.id
                }])
                .select();

            if (err) throw err;

            newNoteContent = '';
            await loadNotes();
        } catch (err) {
            console.error('Error saving note:', err);
            error = 'Failed to save note';
        }
    }

    function handleEditorUpdate(content: string) {
        newNoteContent = content;
    }

    function handleChapterSelect(event: CustomEvent<{id: string}>) {
        selectedChapterId = event.detail.id;
    }
</script>

<div class="dlltw-container">
    <div class="main-content">
        <div class="header">
            <h1>Don't Live Life This Way - Notes</h1>
            <div class="filters">
                <input 
                    type="text" 
                    placeholder="Search notes..." 
                    bind:value={searchQuery}
                />
                <select bind:value={selectedTag}>
                    <option value="">All Tags</option>
                    {#each [...new Set(notes.flatMap(n => n.tags || []))] as tag}
                        <option value={tag}>{tag}</option>
                    {/each}
                </select>
            </div>
        </div>

        {#if loading}
            <div class="loading">Loading notes...</div>
        {:else if error}
            <div class="error">{error}</div>
        {:else}
            <div class="notes-grid">
                {#each filterNotes(notes) as note}
                    <div class="note-card">
                        {#if editingNote?.id === note.id}
                            <div class="edit-form">
                                <input 
                                    type="text" 
                                    bind:value={editingNote.name} 
                                    placeholder="Title"
                                />
                                <textarea 
                                    bind:value={editingNote.content} 
                                    placeholder="Content"
                                    rows="4"
                                ></textarea>
                                <input 
                                    type="text" 
                                    bind:value={editingNote.tags} 
                                    placeholder="Tags (comma-separated)"
                                />
                                <div class="edit-actions">
                                    <button 
                                        aria-label="Save note"
                                        on:click={saveNote}>Save</button>
                                    <button 
                                        aria-label="Cancel editing"
                                        on:click={() => editingNote = null}>Cancel</button>
                                </div>
                            </div>
                        {:else}
                            <div class="note-header">
                                <h3>{note.name}</h3>
                                <div class="note-actions">
                                    <button 
                                        aria-label="Edit note"
                                        on:click={() => startEditing(note)}>
                                        <span class="material-icons">edit</span>
                                    </button>
                                    <button 
                                        aria-label="Delete note"
                                        on:click={() => deleteNote(note.id)}>
                                        <span class="material-icons">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div class="note-content">{note.content || note.summary}</div>
                            {#if note.tags?.length}
                                <div class="note-tags">
                                    {#each note.tags as tag}
                                        <span class="tag">{tag}</span>
                                    {/each}
                                </div>
                            {/if}
                            <div class="note-footer">
                                <span class="status-badge {getStatusClass(note.status)}">
                                    {note.status}
                                </span>
                                <span class="priority-badge {getPriorityClass(note.priority)}">
                                    {note.priority}
                                </span>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}

        <div class="editor-section">
            <h2>New Note</h2>
            <div class="editor-container">
                <RichTextEditor
                    content={newNoteContent}
                    placeholder="Start writing your note..."
                    onUpdate={handleEditorUpdate}
                />
                <div class="editor-actions">
                    <button 
                        class="save-button" 
                        on:click={saveNewNote}
                        disabled={!newNoteContent}
                    >
                        Save Note
                    </button>
                </div>
            </div>
        </div>
    </div>

    <ChaptersSidebar 
        userId={$user?.id || ''} 
        selectedChapterId={selectedChapterId}
        on:select={handleChapterSelect}
    >
        <span slot="note-count" let:chapter>
            {notes.filter(n => n.chapter_id === chapter.id).length} notes
        </span>
    </ChaptersSidebar>
</div>

<style>
    .dlltw-container {
        display: flex;
        gap: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem;
    }

    .main-content {
        flex: 1;
        min-width: 0;
    }

    .header {
        margin-bottom: 2rem;
    }

    h1 {
        font-size: 1.5rem;
        margin: 0 0 1rem 0;
        color: #333;
    }

    .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    input[type="text"],
    select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .notes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .note-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .note-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
    }

    .note-actions {
        display: flex;
        gap: 0.5rem;
    }

    .note-actions button {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.25rem;
    }

    .note-actions button:hover {
        color: #333;
    }

    .note-content {
        font-size: 0.9rem;
        color: #333;
        line-height: 1.5;
        flex-grow: 1;
    }

    .note-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tag {
        background: #f0f0f0;
        color: #666;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .note-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
    }

    .status-badge,
    .priority-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .status-badge.not-started {
        background: #fff3e0;
        color: #e65100;
    }

    .status-badge.in-progress {
        background: #e3f2fd;
        color: #1565c0;
    }

    .status-badge.done {
        background: #e8f5e9;
        color: #2e7d32;
    }

    .priority-badge.low {
        background: #e8f5e9;
        color: #2e7d32;
    }

    .priority-badge.medium {
        background: #fff3e0;
        color: #e65100;
    }

    .priority-badge.high {
        background: #fce4ec;
        color: #c2185b;
    }

    .edit-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .edit-form textarea {
        resize: vertical;
        min-height: 100px;
    }

    .edit-actions {
        display: flex;
        gap: 0.5rem;
    }

    .edit-actions button {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .edit-actions button:first-child {
        background: #0066cc;
        color: white;
    }

    .edit-actions button:last-child {
        background: #f5f5f5;
        color: #666;
    }

    .editor-section {
        margin-top: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
    }

    .editor-section h2 {
        margin: 0 0 1rem 0;
        color: #2d3748;
        font-size: 1.25rem;
    }

    .editor-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .editor-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: 1rem;
    }

    .save-button {
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }

    .save-button:hover {
        background: #43A047;
    }

    .save-button:disabled {
        background: #9E9E9E;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .dlltw-container {
            flex-direction: column;
        }

        .filters {
            flex-direction: column;
        }

        .notes-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
