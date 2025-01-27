<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import type { DatabaseTableConfig } from './types';
    import { user } from '$lib/auth';

    export let config: DatabaseTableConfig;
    export let row: any = {};

    const dispatch = createEventDispatcher();
    
    // Initialize form data with defaults
    let formData = {
        ...row,
        user_id: row.user_id || ($user ? $user.id : null)
    };
    
    let errors: Record<string, string> = {};

    function validate() {
        errors = {};
        let isValid = true;

        config.columns.forEach(column => {
            if (column.required && !formData[column.id]) {
                errors[column.id] = `${column.label} is required`;
                isValid = false;
            }

            if (column.validation && formData[column.id]) {
                const validationResult = column.validation(formData[column.id]);
                if (typeof validationResult === 'string') {
                    errors[column.id] = validationResult;
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    function handleSubmit() {
        if (validate()) {
            // Clean up any undefined or null values
            const cleanData = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => v != null)
            );
            dispatch('save', cleanData);
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            dispatch('close');
        }
    }

    function handleOverlayClick(event) {
        if (event.target === event.currentTarget) {
            dispatch('close');
        }
    }
</script>

<div 
    class="modal-backdrop" 
    on:click={handleOverlayClick}
    on:keydown={handleKeydown}
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="modal-title"
    transition:fade 
>
    <div 
        class="modal-content" 
        on:click|stopPropagation 
        transition:fly="{{ y: 20, duration: 300 }}" 
        role="document"
    >
        <div class="modal-header">
            <h2 id="modal-title">{row.id ? 'Edit' : 'Add'} Record</h2>
            <button 
                class="close-button" 
                on:click={() => dispatch('close')} 
                aria-label="Close modal"
            >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-grid">
                {#each config.columns.filter(col => col.editable !== false && !['created_at', 'updated_at'].includes(col.id)) as column}
                    <div class="form-group">
                        <label for={column.id}>
                            {column.label}
                            {#if column.required}
                                <span class="required">*</span>
                            {/if}
                        </label>

                        {#if column.type === 'select' && column.filterOptions}
                            <select
                                id={column.id}
                                bind:value={formData[column.id]}
                                class:error={errors[column.id]}
                                aria-required={column.required}
                            >
                                <option value="">Select...</option>
                                {#each column.filterOptions as option}
                                    <option value={option}>{option}</option>
                                {/each}
                            </select>
                        {:else if column.type === 'number'}
                            <input
                                type="number"
                                id={column.id}
                                bind:value={formData[column.id]}
                                class:error={errors[column.id]}
                                step="any"
                                aria-required={column.required}
                            />
                        {:else if column.type === 'date'}
                            <input
                                type="date"
                                id={column.id}
                                bind:value={formData[column.id]}
                                class:error={errors[column.id]}
                                aria-required={column.required}
                            />
                        {:else}
                            <input
                                type="text"
                                id={column.id}
                                bind:value={formData[column.id]}
                                class:error={errors[column.id]}
                                aria-required={column.required}
                            />
                        {/if}

                        {#if errors[column.id]}
                            <div class="error-message">
                                {errors[column.id]}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <div class="modal-footer">
                <button 
                    type="button" 
                    class="btn btn-secondary" 
                    on:click={() => dispatch('close')} 
                    aria-label="Cancel"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    class="btn btn-primary" 
                    aria-label={row.id ? 'Save Changes' : 'Add Record'}
                >
                    {row.id ? 'Save Changes' : 'Add Record'}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 50;
    }

    .modal-content {
        background: white;
        border-radius: 0.5rem;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .close-button {
        padding: 0.5rem;
        color: #64748b;
        cursor: pointer;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        padding: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
    }

    .required {
        color: #ef4444;
        margin-left: 0.25rem;
    }

    input, select {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }

    input:focus, select:focus {
        outline: none;
        border-color: #3b82f6;
        ring: 2px solid #bfdbfe;
    }

    .error {
        border-color: #ef4444;
    }

    .error-message {
        font-size: 0.75rem;
        color: #ef4444;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 1rem;
        border-top: 1px solid #e2e8f0;
    }

    .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
    }

    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }

    .btn-primary:hover {
        background-color: #2563eb;
    }

    .btn-secondary {
        background-color: #e2e8f0;
        color: #475569;
    }

    .btn-secondary:hover {
        background-color: #cbd5e1;
    }

    :global(.w-4) {
        width: 1rem;
    }

    :global(.h-4) {
        height: 1rem;
    }
</style>
