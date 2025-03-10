<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';

    export let fundingSource: any;
    
    const dispatch = createEventDispatcher();
    
    let name = fundingSource.name;
    let type = fundingSource.type;
    let amount = fundingSource.amount;
    let equity = fundingSource.equity || 0;
    let notes = fundingSource.notes;
    let error = '';

    function handleSubmit() {
        if (!name || !amount) {
            error = 'Please fill in all required fields';
            return;
        }

        dispatch('submit', {
            id: fundingSource.id,
            name,
            type,
            amount: parseFloat(amount),
            equity: parseFloat(equity),
            notes
        });
        closeModal();
    }

    function handleDelete() {
        if (confirm('Are you sure you want to delete this funding source?')) {
            dispatch('delete', fundingSource.id);
            closeModal();
        }
    }

    function closeModal() {
        dispatch('close');
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

<div class="modal-container">
    <button 
        class="modal-backdrop"
        on:click={closeModal}
        on:keydown={handleKeydown}
        aria-label="Close modal"
    ></button>
    <div 
        class="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        transition:fade
    >
        <div class="modal-header">
            <h2 id="modal-title">Edit Funding Source</h2>
            <button class="close-button" on:click={closeModal} aria-label="Close modal">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        </div>
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            {#if error}
                <div class="error-message" role="alert">
                    {error}
                </div>
            {/if}
            
            <div class="space-y-2">
                <label for="name">Name</label>
                <input 
                    type="text" 
                    id="name" 
                    bind:value={name} 
                    required 
                    placeholder="Enter source name"
                />
            </div>

            <div class="space-y-2">
                <label for="type">Type</label>
                <select id="type" bind:value={type} required>
                    <option value="investor">Investor</option>
                    <option value="founder">Founder</option>
                    <option value="sweat-equity">Sweat Equity</option>
                    <option value="client">Client</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="space-y-2">
                <label for="amount">Amount ($)</label>
                <input 
                    type="number" 
                    id="amount" 
                    bind:value={amount} 
                    required 
                    min="0" 
                    step="0.01"
                    placeholder="Enter amount" 
                />
            </div>

            <div class="space-y-2">
                <label for="equity">Equity Percentage (%)</label>
                <input 
                    type="number" 
                    id="equity" 
                    bind:value={equity} 
                    required 
                    min="0" 
                    max="100" 
                    step="0.01"
                    placeholder="Enter equity percentage" 
                />
            </div>

            <div class="space-y-2">
                <label for="notes">Notes</label>
                <textarea 
                    id="notes" 
                    bind:value={notes} 
                    rows="3"
                    placeholder="Enter any additional notes"
                ></textarea>
            </div>

            <div class="flex justify-between space-x-3">
                <button type="button" class="delete-button" on:click={handleDelete}>
                    <i class="fas fa-trash-alt mr-2"></i>
                    Delete
                </button>
                <div class="flex space-x-3">
                    <button type="button" on:click={closeModal}>Cancel</button>
                    <button type="submit">Save Changes</button>
                </div>
            </div>
        </form>
    </div>
</div>

<style>
    .modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 50;
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(17, 24, 39, 0.75);
        backdrop-filter: blur(4px);
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
    }

    .modal-content {
        position: relative;
        width: 100%;
        max-width: 32rem;
        background: var(--surface-1, white);
        border-radius: 0.75rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform-origin: center;
        animation: modal-pop 0.2s ease-out;
        padding: 1rem;
        z-index: 1;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-2, #e5e7eb);
    }

    .modal-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-1);
        margin: 0;
    }

    .close-button {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        color: var(--text-2);
        transition: all 0.2s;
    }

    .close-button:hover {
        background-color: var(--surface-2);
        color: var(--text-1);
    }

    form {
        padding: 1.5rem;
    }

    .error-message {
        padding: 0.75rem;
        border-radius: 0.5rem;
        background-color: #FEE2E2;
        color: #991B1B;
        font-size: 0.875rem;
    }

    label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-1);
        margin-bottom: 0.5rem;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid var(--border-2, #e5e7eb);
        border-radius: 0.5rem;
        background-color: var(--surface-1);
        color: var(--text-1);
        font-size: 0.875rem;
    }

    input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    button {
        padding: 0.625rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    button[type="submit"] {
        background-color: #3B82F6;
        color: white;
    }

    button[type="submit"]:hover {
        background-color: #2563EB;
    }

    button[type="button"] {
        background-color: var(--surface-2);
        color: var(--text-1);
    }

    button[type="button"]:hover {
        background-color: var(--surface-3);
    }

    .delete-button {
        background-color: #EF4444;
        color: white;
    }

    .delete-button:hover {
        background-color: #DC2626;
    }

    @keyframes modal-pop {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @media (prefers-color-scheme: dark) {
        input, select, textarea {
            background-color: var(--surface-2);
            border-color: var(--border-color);
        }

        input:focus, select:focus, textarea:focus {
            border-color: #60A5FA;
            box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
        }
    }
</style>
