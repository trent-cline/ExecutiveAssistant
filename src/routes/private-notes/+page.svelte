<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { formatDistanceToNow } from 'date-fns';

    let privateNotes = [];
    let loading = true;
    let error = '';

    async function loadPrivateNotes() {
        try {
            const { data, error: err } = await supabase
                .from('brain_dump')
                .select('*')
                .eq('source', 'private_notes')
                .order('created_at', { ascending: false });

            if (err) throw err;
            privateNotes = data || [];
        } catch (e) {
            error = 'Failed to load private notes';
            console.error('Error loading private notes:', e);
        } finally {
            loading = false;
        }
    }

    async function untagNote(noteId) {
        try {
            const { error: err } = await supabase
                .from('brain_dump')
                .update({ source: 'untagged' })
                .eq('id', noteId);

            if (err) throw err;
            
            // Optimistically remove the note from the local array
            privateNotes = privateNotes.filter(note => note.id !== noteId);
        } catch (e) {
            error = 'Failed to untag note';
            console.error('Error untagging note:', e);
        }
    }

    // Subscribe to realtime updates
    onMount(() => {
        loadPrivateNotes();

        const subscription = supabase
            .channel('brain_dump_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'brain_dump',
                    filter: 'source=eq.private_notes'
                }, 
                payload => {
                    loadPrivateNotes();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });
</script>

<div class="container">
    <h1>Private Notes</h1>
    <p class="description">
        These are notes that have been privately sent to you from the main page.
    </p>

    {#if loading}
        <div class="loading">
            <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
            <span>Loading notes...</span>
        </div>
    {:else if error}
        <div class="error">
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            <span>{error}</span>
        </div>
    {:else if privateNotes.length === 0}
        <div class="empty">
            <i class="fas fa-comments" aria-hidden="true"></i>
            <p>No private notes yet. Notes sent from the main page will appear here.</p>
        </div>
    {:else}
        <div class="notes-grid">
            {#each privateNotes as note}
                <div class="note-card">
                    <div class="note-content">
                        {note.content}
                    </div>
                    <div class="note-meta">
                        <span class="note-time">
                            <i class="fas fa-clock" aria-hidden="true"></i>
                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                        <button 
                            class="untag-button"
                            on:click={() => untagNote(note.id)}
                            aria-label="Remove from private notes"
                        >
                            <i class="fas fa-tag-slash" aria-hidden="true"></i>
                            Untag
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        color: #1a1a1a;
    }

    .description {
        color: #666;
        margin-bottom: 2rem;
    }

    .notes-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .note-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .note-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .note-content {
        font-size: 1rem;
        line-height: 1.5;
        margin-bottom: 1rem;
        color: #333;
    }

    .note-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        color: #666;
    }

    .note-time {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .untag-button {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: 0.25rem;
        background: #f1f5f9;
        color: #64748b;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .untag-button:hover {
        background: #e2e8f0;
        color: #475569;
    }

    .untag-button i {
        font-size: 0.875rem;
    }

    .loading, .error, .empty {
        text-align: center;
        padding: 2rem;
        color: #666;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .loading i, .error i, .empty i {
        font-size: 2rem;
    }

    .error {
        color: #dc3545;
    }

    @media (max-width: 640px) {
        .notes-grid {
            grid-template-columns: 1fr;
        }

        .note-card {
            padding: 1rem;
        }

        h1 {
            font-size: 1.5rem;
        }
    }
</style>
