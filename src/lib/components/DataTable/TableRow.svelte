<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    import type { Column } from './types';

    export let row: any;
    export let columns: Column[];
    export let selected = false;

    const dispatch = createEventDispatcher();

    function handleAction(action: string, rowData: any) {
        dispatch('action', { action, rowData });
    }
</script>

<tr class:selected transition:fade={{ duration: 200 }}>
    {#each columns as column}
        <td style={column.width ? `width: ${column.width}` : undefined}>
            {#if column.template}
                {@html column.template(row[column.id], row)}
            {:else if column.actions}
                <div class="actions">
                    {#each column.actions as action}
                        <button 
                            class="action-button" 
                            on:click={() => handleAction(action.action, row)}
                            aria-label={action.label}
                            title={action.label}
                        >
                            <i class="fas fa-{action.icon}"></i>
                        </button>
                    {/each}
                </div>
            {:else}
                {row[column.id] || ''}
            {/if}
        </td>
    {/each}
</tr>

<style>
    tr {
        transition: background-color 0.2s;
    }

    tr:hover {
        background-color: #f8fafc;
    }

    tr.selected {
        background-color: #e0f2fe;
    }

    tr.selected:hover {
        background-color: #bae6fd;
    }

    td {
        padding: 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        color: #1e293b;
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    td :global(a) {
        color: #2563eb;
        text-decoration: none;
    }

    td :global(a:hover) {
        text-decoration: underline;
    }

    td :global(.action-button) {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 0.25rem;
        transition: color 0.2s;
    }

    td :global(.action-button:hover) {
        color: #475569;
    }

    td :global(.status-badge) {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
    }
</style>
