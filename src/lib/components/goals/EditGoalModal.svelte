<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { supabase } from '$lib/supabase';

    export let show = false;
    export let goal;
    export let onClose;
    export let onSave;

    const dispatch = createEventDispatcher();
    let title = goal?.title || '';
    let description = goal?.description || '';
    let category = goal?.category || '';
    let target_value = goal?.target_value || 0;
    let current_value = goal?.current_value || 0;
    let deadline = goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '';
    let status = goal?.status || 'active';
    let error = '';

    async function handleSubmit() {
        try {
            const updates = {
                title,
                description,
                category,
                target_value,
                current_value,
                deadline: deadline ? new Date(deadline).toISOString() : null,
                updated_at: new Date().toISOString(),
                status
            };

            // Add completed_at if status is being changed to completed
            if (status === 'completed' && goal.status !== 'completed') {
                updates.completed_at = new Date().toISOString();
            }

            const { error: err } = await supabase
                .from('goals')
                .update(updates)
                .eq('id', goal.id);

            if (err) throw err;
            
            dispatch('save');
            show = false;
        } catch (err) {
            error = err.message;
        }
    }

    function handleClose() {
        show = false;
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            onClose();
        }
    }

    function handleOverlayClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }
</script>

{#if show}
    <div 
        class="modal-backdrop" 
        class:show
        on:click={handleOverlayClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-goal-title"
        transition:fade
    >
        <div 
            class="modal-content"
            on:click|stopPropagation
            role="document"
            transition:scale={{duration: 300, start: 0.95}}
        >
            <div class="modal-header">
                <h2 id="edit-goal-title">Edit Goal</h2>
                <button 
                    class="close-button"
                    on:click={onClose}
                    aria-label="Close edit goal"
                >
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <form on:submit|preventDefault={handleSubmit}>
                {#if error}
                    <div class="error">{error}</div>
                {/if}

                <div class="form-group">
                    <label for="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        bind:value={title}
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea
                        id="description"
                        bind:value={description}
                        rows="3"
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="category">Category</label>
                    <select id="category" bind:value={category}>
                        <option value="personal">Personal</option>
                        <option value="work">Work</option>
                        <option value="health">Health</option>
                        <option value="finance">Finance</option>
                        <option value="learning">Learning</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="current_value">Current Progress</label>
                        <input
                            type="number"
                            id="current_value"
                            bind:value={current_value}
                            min="0"
                        />
                    </div>

                    <div class="form-group">
                        <label for="target_value">Target Value</label>
                        <input
                            type="number"
                            id="target_value"
                            bind:value={target_value}
                            min="0"
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label for="deadline">Deadline (optional)</label>
                    <input
                        type="date"
                        id="deadline"
                        bind:value={deadline}
                    />
                </div>

                <div class="form-group">
                    <label for="status">Status</label>
                    <select id="status" bind:value={status}>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                    </select>
                </div>

                <div class="button-group">
                    <button type="button" class="cancel-btn" on:click={onClose}>
                        Cancel
                    </button>
                    <button type="submit" class="save-btn">
                        Save Changes
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

    .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 2rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #4a5568;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: background-color 0.2s;
    }

    .close-button:hover {
        background: #f7fafc;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #4a5568;
        margin-bottom: 0.5rem;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 1rem;
        color: #2d3748;
        transition: border-color 0.2s;
    }

    input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #4c1d95;
    }

    .error {
        color: #e53e3e;
        background: #fff5f5;
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }

    .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    .cancel-btn, .save-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn {
        background: white;
        border: 1px solid #e2e8f0;
        color: #4a5568;
    }

    .cancel-btn:hover {
        background: #f7fafc;
    }

    .save-btn {
        background: #4c1d95;
        color: white;
        border: none;
    }

    .save-btn:hover {
        background: #6b21a8;
    }

    @media (max-width: 640px) {
        .modal-content {
            padding: 1rem;
        }

        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>
