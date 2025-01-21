<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';

    interface DLLTWNote {
        id: string;
        name: string;
        summary: string;
        content: string;
        status: 'Not Started' | 'In Progress' | 'Done';
        priority: 'Low' | 'Medium' | 'High';
        category: 'Note' | 'Task' | 'Reminder';
        chapter: string;
        tags: string[];
        created_at: string;
    }

    let notes: DLLTWNote[] = [];
    let loading = true;
    let error = '';
    let editingNote: DLLTWNote | null = null;
    let searchQuery = '';
    let selectedChapter = '';
    let selectedTag = '';

    let chapters: string[] = [];
    let allTags: string[] = [];

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

            // Extract unique chapters and tags
            chapters = [...new Set(notes.map(n => n.chapter).filter(Boolean))];
            allTags = [...new Set(notes.flatMap(n => n.tags || []))];
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
                    chapter: editingNote.chapter,
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

            const matchesChapter = selectedChapter === '' || note.chapter === selectedChapter;
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
</script>

<div class="dlltw-container">
    <div class="header">
        <h1>Don't Live Life This Way - Notes</h1>
        <div class="filters">
            <input 
                type="text" 
                placeholder="Search notes..." 
                bind:value={searchQuery}
            />
            <select bind:value={selectedChapter}>
                <option value="">All Chapters</option>
                {#each chapters as chapter}
                    <option value={chapter}>{chapter}</option>
                {/each}
            </select>
            <select bind:value={selectedTag}>
                <option value="">All Tags</option>
                {#each allTags as tag}
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
                            <input 
                                type="text" 
                                bind:value={editingNote.chapter} 
                                placeholder="Chapter"
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
                                <button on:click={saveNote}>Save</button>
                                <button on:click={() => editingNote = null}>Cancel</button>
                            </div>
                        </div>
                    {:else}
                        <div class="note-header">
                            <h3>{note.name}</h3>
                            <div class="note-actions">
                                <button on:click={() => startEditing(note)}>
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button on:click={() => deleteNote(note.id)}>
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        {#if note.chapter}
                            <div class="note-chapter">Chapter: {note.chapter}</div>
                        {/if}
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
</div>

<style>
    .dlltw-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
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

    .note-chapter {
        font-size: 0.9rem;
        color: #666;
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

    /* Mobile styles */
    @media (max-width: 767px) {
        .dlltw-container {
            padding: 0.5rem;
        }

        .filters {
            flex-direction: column;
        }

        .notes-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
