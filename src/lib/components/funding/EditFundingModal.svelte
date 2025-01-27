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
            notes,
            date: new Date()
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
</script>

<div class="modal-backdrop" on:click|self={closeModal} transition:fade>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Edit Funding Source</h2>
            <button class="close-button" on:click={closeModal}>
                <i class="fas fa-times"></i>
            </button>
        </div>
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            {#if error}
                <div class="error-message">
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
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(17, 24, 39, 0.75);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 50;
        padding: 1rem;
    }

    .modal-content {
        width: 100%;
        max-width: 32rem;
        background: var(--surface-1, white);
        border-radius: 0.75rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform-origin: center;
        animation: modal-pop 0.2s ease-out;
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

    .space-y-4 > :not([hidden]) ~ :not([hidden]) {
        margin-top: 1rem;
    }

    .space-y-2 > :not([hidden]) ~ :not([hidden]) {
        margin-top: 0.5rem;
    }

    label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-2);
        margin-bottom: 0.25rem;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--border-2, #e5e7eb);
        border-radius: 0.5rem;
        background-color: var(--surface-1);
        color: var(--text-1);
        font-size: 0.875rem;
        transition: all 0.2s;
    }

    input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #4F46E5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .flex {
        display: flex;
    }

    .justify-between {
        justify-content: space-between;
    }

    .justify-end {
        justify-content: flex-end;
    }

    .space-x-3 > :not([hidden]) ~ :not([hidden]) {
        margin-left: 0.75rem;
    }

    .mr-2 {
        margin-right: 0.5rem;
    }

    button {
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 0.5rem;
        transition: all 0.2s;
    }

    button[type="submit"] {
        background-color: #4F46E5;
        color: white;
        border: 1px solid transparent;
    }

    button[type="submit"]:hover {
        background-color: #4338CA;
    }

    button[type="button"] {
        background-color: white;
        color: var(--text-2);
        border: 1px solid var(--border-2, #e5e7eb);
    }

    button[type="button"]:hover {
        background-color: var(--surface-2);
        color: var(--text-1);
    }

    .delete-button {
        background-color: #FEE2E2;
        color: #991B1B;
        border: 1px solid #FCA5A5;
    }

    .delete-button:hover {
        background-color: #FEE2E2;
        color: #7F1D1D;
    }

    @keyframes modal-pop {
        0% {
            opacity: 0;
            transform: scale(0.95);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    @media (prefers-color-scheme: dark) {
        .modal-content {
            background-color: var(--surface-2, #1f2937);
        }

        .error-message {
            background-color: #7F1D1D;
            color: #FEE2E2;
        }

        input, select, textarea {
            background-color: var(--surface-2);
            border-color: #374151;
        }

        input:focus, select:focus, textarea:focus {
            border-color: #6366F1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        button[type="button"] {
            background-color: #374151;
            border-color: #4B5563;
        }

        button[type="button"]:hover {
            background-color: #4B5563;
        }

        .delete-button {
            background-color: #7F1D1D;
            color: #FEE2E2;
            border-color: #991B1B;
        }

        .delete-button:hover {
            background-color: #991B1B;
        }
    }
</style>
