<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { supabase } from '$lib/supabase';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column } from '$lib/components/DatabaseTable/types';

    export let show = false;
    export let onClose: () => void;

    let notes = [];
    let loading = true;
    let error = '';

    const columns: Column[] = [
        {
            id: 'name',
            label: 'Name',
            width: '200px',
            sortable: true,
            type: 'text'
        },
        {
            id: 'summary',
            label: 'Summary',
            width: '400px',
            sortable: true,
            type: 'text'
        },
        {
            id: 'category',
            label: 'Category',
            width: '120px',
            sortable: true,
            filterable: true,
            type: 'select'
        },
        {
            id: 'priority',
            label: 'Priority',
            width: '100px',
            sortable: true,
            filterable: true,
            type: 'select'
        },
        {
            id: 'completed_at',
            label: 'Completed',
            width: '150px',
            sortable: true,
            type: 'date',
            template: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        {
            id: 'created_at',
            label: 'Created',
            width: '150px',
            sortable: true,
            type: 'date',
            template: (value) => value ? new Date(value).toLocaleDateString() : ''
        }
    ];

    const config = {
        tableName: 'brain_dump_database',
        columns,
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true
        },
        defaultSort: {
            column: 'completed_at',
            direction: 'desc'
        }
    };

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
        on:click={handleOverlayClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-notes-title"
        transition:fade
    >
        <div 
            class="modal-content"
            on:click|stopPropagation
            role="document"
            transition:fly="{{ y: 20, duration: 300 }}"
        >
            <div class="modal-header">
                <h2 id="completed-notes-title">Completed Notes</h2>
                <button 
                    class="close-button"
                    on:click={onClose}
                    aria-label="Close completed notes"
                >
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <div class="modal-body">
                <DatabaseTable
                    {supabase}
                    {config}
                    initialData={notes}
                />
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
    }

    .close-button:hover {
        background: #f3f4f6;
    }

    .modal-body {
        padding: 1rem;
        overflow-y: auto;
        flex: 1;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            max-height: 95vh;
        }
    }
</style>
