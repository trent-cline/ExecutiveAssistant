<script>
    import { fade, scale } from 'svelte/transition';
    import GoalCard from './GoalCard.svelte';

    export let show = false;
    export let onClose;
    export let goals = [];

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
        aria-labelledby="completed-goals-title"
        transition:fade
    >
        <div 
            class="modal-content"
            on:click|stopPropagation
            role="document"
            transition:scale={{duration: 300, start: 0.95}}
        >
            <div class="modal-header">
                <h2 id="completed-goals-title">🏆 Completed Goals</h2>
                <button 
                    class="close-btn"
                    on:click={handleClose}
                    aria-label="Close completed goals"
                >
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <div class="goals-grid">
                {#if goals.length === 0}
                    <p class="no-goals">No completed goals yet. Keep working towards your objectives!</p>
                {:else}
                    {#each goals as goal (goal.id)}
                        <GoalCard {goal} />
                    {/each}
                {/if}
            </div>
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
        max-width: 1200px;
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

    .close-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #4a5568;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: background-color 0.2s;
    }

    .close-btn:hover {
        background: #f7fafc;
    }

    .goals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .no-goals {
        text-align: center;
        color: #4a5568;
        grid-column: 1 / -1;
        padding: 2rem;
    }

    @media (max-width: 640px) {
        .modal-content {
            padding: 1rem;
        }
    }
</style>
