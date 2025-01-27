<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';

    const dispatch = createEventDispatcher();

    export let show = false;

    let name = '';
    let summary = '';
    let quantity = 1;
    let priority: 'Low' | 'Medium' | 'High' = 'Medium';
    let status: 'Not Started' | 'In Progress' | 'Done' = 'Not Started';
    let error = '';

    async function handleSubmit() {
        if (!name.trim()) {
            error = 'Name is required';
            return;
        }

        try {
            const { data, error: err } = await supabase
                .from('shopping_list')
                .insert([
                    {
                        name: name.trim(),
                        summary,
                        quantity,
                        priority,
                        status,
                        checked: false,
                        user_id: $user?.id
                    }
                ])
                .select()
                .single();

            if (err) throw err;
            dispatch('itemAdded', data);
            close();
        } catch (err) {
            console.error('Error adding item:', err);
            error = err.message;
        }
    }

    function close() {
        name = '';
        summary = '';
        quantity = 1;
        priority = 'Medium';
        status = 'Not Started';
        error = '';
        show = false;
        dispatch('close');
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click|self={close}>
        <div class="modal">
            <div class="modal-header">
                <h2>Add New Item</h2>
                <button class="close-button" on:click={close}>×</button>
            </div>

            {#if error}
                <div class="error">{error}</div>
            {/if}

            <form on:submit|preventDefault={handleSubmit}>
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input
                        id="name"
                        type="text"
                        bind:value={name}
                        placeholder="Enter item name"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="summary">Summary</label>
                    <textarea
                        id="summary"
                        bind:value={summary}
                        placeholder="Enter summary"
                        rows="3"
                    ></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="quantity">Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            bind:value={quantity}
                            min="1"
                            max="99"
                        />
                    </div>

                    <div class="form-group">
                        <label for="priority">Priority</label>
                        <select id="priority" bind:value={priority}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" bind:value={status}>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>
                    </div>
                </div>

                <div class="button-group">
                    <button type="button" class="cancel-button" on:click={close}>
                        Cancel
                    </button>
                    <button type="submit" class="submit-button">
                        Add Item
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
        border-radius: 8px;
        padding: 1.5rem;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #2d3748;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #a0aec0;
        cursor: pointer;
        padding: 0.25rem;
    }

    .close-button:hover {
        color: #718096;
    }

    .error {
        background-color: #fed7d7;
        color: #c53030;
        padding: 0.75rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #4a5568;
        font-size: 0.875rem;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        font-size: 1rem;
    }

    textarea {
        resize: vertical;
    }

    .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }

    button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .cancel-button {
        background: #e2e8f0;
        border: none;
        color: #4a5568;
    }

    .submit-button {
        background: #4299e1;
        border: none;
        color: white;
    }

    .cancel-button:hover {
        background: #cbd5e0;
    }

    .submit-button:hover {
        background: #3182ce;
    }

    @media (max-width: 640px) {
        .modal {
            width: 95%;
            padding: 1rem;
        }

        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>
