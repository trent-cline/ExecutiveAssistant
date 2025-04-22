<!-- EditNoteModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { enhance } from '$app/forms';
    import type { Note } from '$lib/types/notes';

    export let show = false;
    export let note: Note | null = null;

    const dispatch = createEventDispatcher();

    let loading = false;
    let error: string | null = null;

    function handleClose() {
        dispatch('close');
    }

    $: if (!show) {
        error = null;
        loading = false;
    }
</script>

{#if show}
    <div 
    class="modal-backdrop" 
    on:click={handleClose} 
    on:keydown={(e) => e.key === 'Escape' && handleClose()} 
    role="presentation"
></div>
    <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-content">
            <header class="modal-header">
                <h2>{note ? 'Edit Note' : 'Create Note'}</h2>
                <button class="btn-icon" on:click={handleClose}>
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </header>

            {#if loading}
                <div class="skeleton-loader-modal">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-field"></div>
                    <div class="skeleton-field"></div>
                    <div class="skeleton-field"></div>
                    <div class="skeleton-footer"></div>
                </div>
            {:else}
            <form
                method="POST"
                action="?/updateNote"
                use:enhance={() => {
                    loading = true;
                    error = null;
                    return async ({ result }) => {
                        loading = false;
                        if (result.type === 'success') {
                            dispatch('save');
                        } else if (result.type === 'failure') {
                            error = result.data?.message || 'Failed to save note';
                        }
                    };
                }}
            >
                {#if note}
                    <input type="hidden" name="noteId" value={note.id}>
                {/if}

                <div class="form-field">
                    <label for="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={note?.name || ''}
                        required
                        class="input"
                    />
                </div>

                <div class="form-field">
                    <label for="summary">Summary</label>
                    <textarea
                        id="summary"
                        name="summary"
                        value={note?.summary || ''}
                        rows="3"
                        class="textarea"
                    ></textarea>
                </div>

                <div class="form-field">
                    <label for="category">Category</label>
                    <input
                        type="text"
                        id="category"
                        name="category"
                        value={note?.category || ''}
                        class="input"
                    />
                </div>

                <div class="form-field">
                    <label for="priority">Priority</label>
                    <select id="priority" name="priority" class="select" value={note?.priority || 'Medium'}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                <div class="form-field">
                    <label for="status">Status</label>
                    <select id="status" name="status" class="select" value={note?.status || 'Not Started'}>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                </div>

                <div class="form-field">
                    <label class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_public"
                            checked={note?.is_public || false}
                            class="checkbox"
                        />
                        <span>Public Note</span>
                    </label>
                </div>

                {#if error}
                    <div class="alert variant-filled-error">{error}</div>
                {/if}

                <footer class="modal-footer">
                    <button type="button" class="btn variant-ghost" on:click={handleClose}>
                        Cancel
                    </button>
                    <button type="submit" class="btn variant-filled-primary" disabled={loading}>
                        {#if loading}
                            <i class="fas fa-spinner fa-spin mr-2" aria-hidden="true"></i>
                        {/if}
                        Save Note
                    </button>
                </footer>
            </form>
            {/if} 
        </div>
    </div>
{/if}

<style lang="postcss">
    .modal-backdrop {
        @apply fixed inset-0 bg-black/50 z-40;
    }

    .modal {
        @apply fixed inset-0 flex items-center justify-center z-50 p-4;
    }

    .modal-content {
        @apply bg-surface-100 rounded-container-token w-full max-w-lg shadow-xl;
    }

    .modal-header {
        @apply flex justify-between items-center p-4 border-b border-surface-500/20;
    }

    .modal-footer {
        @apply flex justify-end gap-2 p-4 border-t border-surface-500/20;
    }

    .form-field {
        @apply p-4;
    }

    .form-field label {
        @apply block mb-2 font-medium;
    }

    .alert {
        @apply p-4 mx-4 mb-4 rounded-container-token;
    }
.skeleton-loader-modal {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 2rem 1.5rem;
    align-items: stretch;
}
.skeleton-header {
    height: 2rem;
    width: 60%;
    border-radius: 0.5rem;
    background: linear-gradient(90deg, #e0e7ef 25%, #f3f4f6 50%, #e0e7ef 75%);
    animation: skeleton-shimmer 1.2s infinite linear;
}
.skeleton-field {
    height: 1.5rem;
    width: 100%;
    border-radius: 0.375rem;
    background: linear-gradient(90deg, #e0e7ef 25%, #f3f4f6 50%, #e0e7ef 75%);
    animation: skeleton-shimmer 1.2s infinite linear;
}
.skeleton-footer {
    height: 2.5rem;
    width: 40%;
    border-radius: 0.5rem;
    background: linear-gradient(90deg, #e0e7ef 25%, #f3f4f6 50%, #e0e7ef 75%);
    animation: skeleton-shimmer 1.2s infinite linear;
    align-self: flex-end;
}
@keyframes skeleton-shimmer {
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: 200px 0;
    }
}
</style>
