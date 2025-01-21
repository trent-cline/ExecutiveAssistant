<script lang="ts">
    import { formatDistanceToNow } from 'date-fns';
    import type { Note } from '$lib/types';
    
    export let note: Note;
    export let showActions = true;
    export let onDelete: (note: Note) => void = () => {};
    export let onEdit: (note: Note) => void = () => {};
    export let onAnalyze: (note: Note) => void = () => {};

    $: timeAgo = formatDistanceToNow(new Date(note.created_at), { addSuffix: true });
</script>

<div class="note-card">
    <div class="note-content">
        {note.content}
    </div>
    
    {#if showActions}
        <div class="note-actions">
            <button class="icon-button" on:click={() => onEdit(note)} title="Edit">
                <i class="fas fa-edit" aria-hidden="true"></i>
            </button>
            <button class="icon-button" on:click={() => onAnalyze(note)} title="Analyze">
                <i class="fas fa-brain" aria-hidden="true"></i>
            </button>
            <button class="icon-button delete" on:click={() => onDelete(note)} title="Delete">
                <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
        </div>
    {/if}
    
    <div class="note-meta">
        <span class="note-time">
            <i class="fas fa-clock" aria-hidden="true"></i>
            {timeAgo}
        </span>
        {#if note.analyzed}
            <span class="note-status analyzed">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
                Analyzed
            </span>
        {/if}
    </div>
</div>

<style>
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

    .note-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .icon-button {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: #666;
        transition: color 0.2s;
        border-radius: 4px;
    }

    .icon-button:hover {
        color: #333;
        background: #f5f5f5;
    }

    .icon-button.delete:hover {
        color: #dc3545;
    }

    .note-meta {
        font-size: 0.875rem;
        color: #666;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .note-time {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .note-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
    }

    .note-status.analyzed {
        background: #e8f5e9;
        color: #2e7d32;
    }

    @media (max-width: 640px) {
        .note-card {
            padding: 1rem;
        }

        .note-meta {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
</style>
