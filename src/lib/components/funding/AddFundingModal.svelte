<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    import Card from '$lib/components/containers/Card.svelte';
    
    type FundingType = 'investor' | 'client' | 'founder' | 'sweat-equity' | 'other';
    
    interface NewFundingSource {
        name: string;
        type: FundingType;
        amount: number;
        equity: number;
        notes: string;
    }
    
    const dispatch = createEventDispatcher<{
        submit: NewFundingSource;
        close: void;
    }>();
    
    let error = '';
    let newSource: NewFundingSource = {
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
        if (!newSource.name || !newSource.amount) {
            error = 'Please fill in all required fields';
            return;
        }
        dispatch('submit', newSource);
        closeModal();
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
        <Card>
            <div class="modal-header">
                <h2 id="modal-title">Add New Funding Source</h2>
                <button class="close-button" on:click={closeModal} aria-label="Close modal">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
            
            {#if error}
                <div class="error-message" role="alert">
                    {error}
                </div>
            {/if}
            
            <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                <div class="form-group">
                    <label for="source-name">Source Name</label>
                    <input
                        id="source-name"
                        type="text"
                        bind:value={newSource.name}
                        placeholder="Enter source name"
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="source-type">Source Type</label>
                    <select
                        id="source-type"
                        bind:value={newSource.type}
                    >
                        <option value="investor">Investor</option>
                        <option value="founder">Founder</option>
                        <option value="sweat-equity">Sweat Equity</option>
                        <option value="client">Client</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="source-amount">Amount ($)</label>
                    <input
                        id="source-amount"
                        type="number"
                        bind:value={newSource.amount}
                        min="0"
                        step="0.01"
                        placeholder="Enter amount"
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="source-equity">Equity Percentage (%)</label>
                    <input
                        id="source-equity"
                        type="number"
                        bind:value={newSource.equity}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Enter equity percentage"
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="source-notes">Notes</label>
                    <textarea
                        id="source-notes"
                        bind:value={newSource.notes}
                        rows="3"
                        placeholder="Add any additional notes"
                    ></textarea>
                </div>
                
                <div class="button-group">
                    <button
                        type="button"
                        class="cancel-button"
                        on:click={closeModal}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="submit-button"
                    >
                        Add Source
                    </button>
                </div>
            </form>
        </Card>
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

    .error-message {
        padding: 0.75rem;
        border-radius: 0.5rem;
        background-color: #FEE2E2;
        color: #991B1B;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-1);
        margin-bottom: 0.5rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid var(--border-2, #e5e7eb);
        border-radius: 0.5rem;
        background-color: var(--surface-1);
        color: var(--text-1);
        font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }

    .button-group button {
        padding: 0.625rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .cancel-button {
        background-color: var(--surface-2);
        color: var(--text-1);
    }

    .cancel-button:hover {
        background-color: var(--surface-3);
    }

    .submit-button {
        background-color: #3B82F6;
        color: white;
    }

    .submit-button:hover {
        background-color: #2563EB;
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
        .form-group input,
        .form-group select,
        .form-group textarea {
            background-color: var(--surface-2);
            border-color: var(--border-color);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            border-color: #60A5FA;
            box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
        }

        .error-message {
            background-color: #7F1D1D;
            color: #FEE2E2;
        }
    }
</style>
