<script lang="ts">
    import { onMount } from 'svelte';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import DataTable from '$lib/components/DataTable/DataTable.svelte';
    import type { Column } from '$lib/components/DataTable/types';

    interface Note {
        id?: string;
        name: string;
        due_date?: string;
        status?: 'done' | 'pending';
        localid: string;
        summary?: string;
        priority?: string;
        category?: string;
        created_at?: string;
        completed_at?: string;
    }

    let notes: Note[] = [];
    let loading = false;
    let error = '';

    const columns: Column[] = [
        {
            id: 'status',
            label: '',
            width: '50px',
            template: (_, row) => `
                <button 
                    class="action-button ${row.status === 'done' ? 'done' : ''}"
                    title="${row.status === 'done' ? 'Mark as pending' : 'Mark as done'}"
                >
                    <i class="fas fa-check"></i>
                </button>
            `
        },
        {
            id: 'created_at',
            label: 'Time',
            width: '180px',
            sortable: true,
            template: (value) => value ? new Date(value).toLocaleString() : ''
        },
        {
            id: 'name',
            label: 'Note',
            sortable: true,
            template: (value, row) => `
                <div class="note-content ${row.status === 'done' ? 'done' : ''}">
                    <p class="transcription">${value || ''}</p>
                    ${row.summary ? `<p class="summary">${row.summary}</p>` : ''}
                </div>
            `
        },
        {
            id: 'category',
            label: 'Category',
            width: '120px',
            sortable: true,
            filterOptions: ['Task', 'Idea', 'Meeting', 'Other']
        },
        {
            id: 'priority',
            label: 'Priority',
            width: '100px',
            sortable: true,
            filterOptions: ['High', 'Medium', 'Low']
        },
        {
            id: 'actions',
            label: '',
            width: '50px',
            template: (_, row) => `
                <button 
                    class="action-button delete-button" 
                    title="Delete note"
                >
                    <i class="fas fa-trash"></i>
                </button>
            `
        }
    ];

    // Ensure user is authenticated for notes page
    $: if (!$user) {
        goto('/login');
    }

    onMount(() => {
        loadNotes();
    });

    function loadNotes() {
        loading = true;
        try {
            // Load notes from localStorage
            const savedNotes = localStorage.getItem('voice-notes');
            if (savedNotes) {
                notes = JSON.parse(savedNotes);
                // Sort notes with done items at the bottom
                notes.sort((a, b) => {
                    if (a.status === 'done' && b.status !== 'done') return 1;
                    if (a.status !== 'done' && b.status === 'done') return -1;
                    if (a.status === 'done' && b.status === 'done') {
                        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
            }
        } catch (err) {
            error = 'Failed to load notes';
            console.error('Error loading notes:', err);
        } finally {
            loading = false;
        }
    }

    async function toggleNoteStatus(note: Note) {
        const newStatus = note.status === 'done' ? 'pending' : 'done';
        const updatedNote = {
            ...note,
            status: newStatus,
            completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
        };

        // Update in local array
        notes = notes.map(n => n.localid === note.localid ? updatedNote : n);
        
        // Sort notes with recently completed at the top of done section
        notes.sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            if (a.status === 'done' && b.status === 'done') {
                return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // Update localStorage
        localStorage.setItem('voice-notes', JSON.stringify(notes));

        // Update database if note has an ID
        if (note.id) {
            try {
                const response = await fetch('/api/supabase', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ note: updatedNote })
                });

                if (!response.ok) {
                    console.error('Failed to update note in database');
                }
            } catch (error) {
                console.error('Error updating note in database:', error);
            }
        }
    }

    async function deleteNote(note: Note) {
        if (confirm('Are you sure you want to delete this note?')) {
            // Remove from local storage
            localStorage.removeItem(`note_${note.localid}`);
            
            // Update notes array
            notes = notes.filter(n => n.localid !== note.localid);
            localStorage.setItem('voice-notes', JSON.stringify(notes));

            try {
                // Delete from database if it exists
                if (note.id) {
                    const response = await fetch('/api/supabase', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ noteId: note.id })
                    });

                    if (!response.ok) {
                        console.error('Failed to delete note from database');
                    }
                }
            } catch (error) {
                console.error('Error deleting note from database:', error);
            }
        }
    }

    function handleTableAction(event: CustomEvent) {
        const { action, rowData } = event.detail;
        if (action === 'delete') {
            deleteNote(rowData);
        } else if (action === 'toggle-status') {
            toggleNoteStatus(rowData);
        }
    }
</script>

<div class="notes-container">
    <h1>Notes</h1>
    
    <DataTable
        {columns}
        data={notes}
        {loading}
        {error}
        on:action={handleTableAction}
    />
</div>

<style>
    .notes-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1e293b;
    }

    :global(.note-content) {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    :global(.note-content.done) {
        opacity: 0.6;
    }

    :global(.note-content .transcription) {
        margin: 0;
        font-size: 0.875rem;
    }

    :global(.note-content .summary) {
        margin: 0;
        font-size: 0.75rem;
        color: #64748b;
    }

    :global(.action-button.done) {
        color: #22c55e;
    }

    :global(.delete-button) {
        color: #ef4444;
    }

    :global(.delete-button:hover) {
        color: #dc2626;
    }
</style>
