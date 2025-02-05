<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import Card from '$lib/components/containers/Card.svelte';
    
    export let show = false;
    
    const dispatch = createEventDispatcher();
    
    let error = '';
    let newSource = {
        name: '',
        type: 'investor',
        amount: 0,
        equity: 0,
        notes: ''
    };

    function closeModal() {
        dispatch('close');
        // Reset form
        newSource = {
            name: '',
            type: 'investor',
            amount: 0,
            equity: 0,
            notes: ''
        };
        error = '';
    }

    function handleSubmit() {
        if (!newSource.name || !newSource.amount || !newSource.equity) {
            error = 'Please fill in all required fields';
            return;
        }
        dispatch('submit', newSource);
        closeModal();
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click|self={closeModal} role="dialog" aria-modal="true" aria-labelledby="modal-title" transition:fade>
        <div class="modal-content" transition:slide>
            <Card>
                <div class="modal-header">
                    <h2 id="modal-title">Add New Funding Source</h2>
                    <button class="close-button" on:click={closeModal} aria-label="Close modal">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                
                {#if error}
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <span class="block sm:inline">{error}</span>
                    </div>
                {/if}
                
                <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                    <div class="space-y-2">
                        <label for="source-name" class="block text-sm font-medium text-gray-700">Source Name</label>
                        <input
                            id="source-name"
                            type="text"
                            bind:value={newSource.name}
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter source name"
                            required
                        />
                    </div>
                    
                    <div class="space-y-2">
                        <label for="source-type" class="block text-sm font-medium text-gray-700">Source Type</label>
                        <select
                            id="source-type"
                            bind:value={newSource.type}
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="investor">Investor</option>
                            <option value="founders">Founders</option>
                            <option value="sweat-equity">Sweat Equity</option>
                            <option value="client">Client</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="space-y-2">
                        <label for="source-amount" class="block text-sm font-medium text-gray-700">Amount ($)</label>
                        <input
                            id="source-amount"
                            type="number"
                            bind:value={newSource.amount}
                            min="0"
                            step="0.01"
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter amount"
                            required
                        />
                    </div>
                    
                    <div class="space-y-2">
                        <label for="source-equity" class="block text-sm font-medium text-gray-700">Equity Percentage (%)</label>
                        <input
                            id="source-equity"
                            type="number"
                            bind:value={newSource.equity}
                            min="0"
                            max="100"
                            step="0.01"
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter equity percentage"
                            required
                        />
                    </div>
                    
                    <div class="space-y-2">
                        <label for="source-notes" class="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            id="source-notes"
                            bind:value={newSource.notes}
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            rows="3"
                            placeholder="Add any additional notes"
                        ></textarea>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            on:click={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700"
                        >
                            Add Source
                        </button>
                    </div>
                </form>
            </Card>
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

    .justify-end {
        justify-content: flex-end;
    }

    .space-x-3 > :not([hidden]) ~ :not([hidden]) {
        margin-left: 0.75rem;
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
    }
</style>
