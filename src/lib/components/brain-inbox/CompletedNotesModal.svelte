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
        tableName: 'brain_dump',
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
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
        on:click={handleOverlayClick}
        on:keydown={e => e.key === 'Escape' && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-notes-title"
        transition:fade
    >
        <div 
            class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 relative"
            on:click|stopPropagation
            on:keydown|stopPropagation
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
    .fixed {
        position: fixed;
    }

    .inset-0 {
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }

    .bg-black {
        background-color: #000;
    }

    .bg-opacity-50 {
        background-opacity: 0.5;
    }

    .flex {
        display: flex;
    }

    .items-center {
        align-items: center;
    }

    .justify-center {
        justify-content: center;
    }

    .z-50 {
        z-index: 50;
    }

    .bg-white {
        background-color: #fff;
    }

    .rounded-lg {
        border-radius: 0.5rem;
    }

    .p-6 {
        padding: 1.5rem;
    }

    .max-w-2xl {
        max-width: 42rem;
    }

    .w-full {
        width: 100%;
    }

    .mx-4 {
        margin-left: 1rem;
        margin-right: 1rem;
    }

    .relative {
        position: relative;
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
