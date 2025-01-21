<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Column, SortState } from './types';

    export let columns: Column[];
    export let sortState: SortState | null;
    export let selectable = false;
    export let allSelected = false;

    const dispatch = createEventDispatcher();
</script>

<thead>
    <tr>
        {#if selectable}
            <th class="w-10">
                <input
                    type="checkbox"
                    checked={allSelected}
                    on:change={() => dispatch('selectAll')}
                />
            </th>
        {/if}
        
        {#each columns as column}
            <th 
                class:sortable={column.sortable}
                style={column.width ? `width: ${column.width}` : ''}
                on:click={() => {
                    if (column.sortable) {
                        dispatch('sort', column.id);
                    }
                }}
            >
                <div class="header-content">
                    {column.label}
                    {#if column.sortable}
                        <span class="sort-icon">
                            {#if sortState?.column === column.id}
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    {#if sortState.direction === 'asc'}
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    {:else}
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    {/if}
                                </svg>
                            {:else}
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            {/if}
                        </span>
                    {/if}
                </div>
            </th>
        {/each}
        <th class="actions-column">Actions</th>
    </tr>
</thead>

<style>
    th {
        white-space: nowrap;
        user-select: none;
    }

    .sortable {
        cursor: pointer;
    }

    .sortable:hover {
        background-color: #f1f5f9;
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .sort-icon {
        color: #94a3b8;
        display: flex;
        align-items: center;
    }

    .actions-column {
        width: 100px;
        text-align: center;
    }

    :global(.w-4) {
        width: 1rem;
    }

    :global(.h-4) {
        height: 1rem;
    }
</style>
