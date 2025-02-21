<!-- EditNoteModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { supabase } from '$lib/supabase';

    export let note: {
        id: string;
        name: string;
        summary?: string;
        due_date?: string;
        status: 'Not Started' | 'In Progress' | 'Done';
        priority: 'Low' | 'Medium' | 'High';
        category: 'Note' | 'Task' | 'Reminder';
        user_id: string;
        completed_at?: string;
    };
    export let show = false;

    const dispatch = createEventDispatcher();

    let editedNote = { ...note };
    let error = '';
    let loading = false;

    async function handleSubmit() {
        loading = true;
        try {
            const { error: updateError } = await supabase
                .from('brain_dump_database')
                .update({
                    name: editedNote.name,
                    summary: editedNote.summary,
                    due_date: editedNote.due_date,
                    priority: editedNote.priority,
                    category: editedNote.category,
                    status: editedNote.status,
                    completed_at: editedNote.status === 'Done' ? new Date().toISOString() : null
                })
                .eq('id', note.id);

            if (updateError) throw updateError;

            dispatch('save', editedNote);
            close();
        } catch (err) {
            console.error('Error updating note:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function close() {
        show = false;
        dispatch('close');
    }

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            close();
        }
    }
</script>

{#if show}
<div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    on:keydown={e => e.key === 'Escape' && close()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-note-title">
    <div 
        class="modal" 
        on:click|stopPropagation
        on:keydown|stopPropagation
        role="document">
        <div class="modal-header">
            <h2 id="edit-note-title">Edit Note</h2>
            <button class="close-button" on:click={close}>&times;</button>
        </div>
        
        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="name">Name *</label>
                <input 
                    type="text" 
                    id="name" 
                    bind:value={editedNote.name}
                    required
                    placeholder="Enter note name"
                />
            </div>

            <div class="form-group">
                <label for="summary">Summary</label>
                <textarea 
                    id="summary" 
                    bind:value={editedNote.summary}
                    rows="3"
                    placeholder="Enter note details"></textarea>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" bind:value={editedNote.status}>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="priority">Priority</label>
                    <select id="priority" bind:value={editedNote.priority}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="category">Category</label>
                    <select id="category" bind:value={editedNote.category}>
                        <option value="Note">Note</option>
                        <option value="Task">Task</option>
                        <option value="Reminder">Reminder</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="due_date">Due Date</label>
                    <input 
                        type="date" 
                        id="due_date" 
                        bind:value={editedNote.due_date}
                    />
                </div>
            </div>

            {#if error}
                <div class="error">{error}</div>
            {/if}

            <div class="button-group">
                <button type="button" class="cancel" on:click={close} disabled={loading}>Cancel</button>
                <button type="submit" class="save" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        padding: 24px;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #2d3748;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
        color: #718096;
        transition: color 0.2s;
    }

    .close-button:hover {
        color: #2d3748;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
    }

    label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #4a5568;
    }

    input, select, textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;
    }

    input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #4299e1;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }

    textarea {
        resize: vertical;
        min-height: 100px;
    }

    .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #eee;
    }

    button {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }

    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .cancel {
        background: #edf2f7;
        color: #4a5568;
    }

    .cancel:hover:not(:disabled) {
        background: #e2e8f0;
    }

    .save {
        background: #4299e1;
        color: white;
    }

    .save:hover:not(:disabled) {
        background: #3182ce;
    }

    .error {
        color: #e53e3e;
        margin-top: 12px;
        padding: 8px 12px;
        background: #fff5f5;
        border-radius: 6px;
        font-size: 14px;
    }
</style>
