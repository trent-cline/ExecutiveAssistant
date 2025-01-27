<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Column } from './types';

    export let row: any;
    export let columns: Column[];
    export let selected = false;
    export let selectable = false;
    export let actions: { icon: string; label: string; handler: () => void }[] = [];

    const dispatch = createEventDispatcher();

    function handleClick(e: MouseEvent) {
        // Don't trigger row click when clicking actions or checkbox
        if (!(e.target as HTMLElement).closest('.actions, input[type="checkbox"]')) {
            dispatch('click');
        }
    }
</script>

<tr
    class:selected
    class:clickable={!selectable}
    on:click={handleClick}
>
    {#if selectable}
        <td class="checkbox-cell">
            <input
                type="checkbox"
                checked={selected}
                on:change={() => dispatch('select')}
            />
        </td>
    {/if}

    {#each columns as column}
        <td>
            {#if column.template}
                {@html column.template(row[column.id], row)}
            {:else if column.type === 'url'}
                <a href={row[column.id]} target="_blank" rel="noopener noreferrer">
                    {row[column.id]}
                </a>
            {:else if column.type === 'currency'}
                {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(row[column.id] || 0)}
            {:else if column.type === 'percentage'}
                {(row[column.id] || 0).toFixed(1)}%
            {:else}
                {row[column.id]}
            {/if}
        </td>
    {/each}

    <td class="actions">
        {#each actions as action}
            <button 
                class="action-button"
                on:click|stopPropagation={action.handler}
                aria-label={action.label || action.type}
            >
                <i class="fas fa-{action.icon}" aria-hidden="true"></i>
            </button>
        {/each}
    </td>
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

    tr.clickable {
        cursor: pointer;
    }

    .checkbox-cell {
        width: 40px;
        text-align: center;
    }

    td {
        vertical-align: middle;
    }

    /* Icons within regular cells should be treated like text */
    td :global(.fas:not(.action-button .fas)) {
        display: inline-flex;
        align-items: center;
        font-size: 1em;
        margin: 0 0.125rem;
        vertical-align: middle;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.25rem;  
        padding-right: 0.5rem;  
    }

    /* Action buttons remain slightly larger for clickability */
    .action-button {
        padding: 0.125rem;  
        border-radius: 0.25rem;
        background: transparent;
        border: none;
        color: #4a5568;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .action-button:hover {
        background-color: #e2e8f0;
    }
</style>
