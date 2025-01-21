<script lang="ts">
    import type { Column } from './types';
    import FilterMenu from './FilterMenu.svelte';
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';

    export let column: Column;
    export let sortActive = false;
    export let sortDirection: 'asc' | 'desc' = 'asc';
    export let filterActive = false;

    const dispatch = createEventDispatcher();

    let showFilterMenu = false;

    function handleSort() {
        dispatch('sort');
    }

    function handleFilter(event: CustomEvent) {
        dispatch('filter', event.detail);
        showFilterMenu = false;
    }

    function handleClickOutside(event: MouseEvent) {
        const filterMenu = document.querySelector('.filter-menu');
        if (filterMenu && !filterMenu.contains(event.target as Node)) {
            showFilterMenu = false;
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('click', handleClickOutside);
    }
</script>

<th style="width: {column.width || 'auto'}" class="header-cell">
    <div class="header-content">
        <span class="label">{column.label}</span>
        <div class="actions">
            {#if column?.sortable}
                <button 
                    class="action-button sort-button"
                    class:active={sortActive}
                    on:click={handleSort}
                    aria-label={`Sort by ${column.label}`}
                >
                    <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                </button>
            {/if}
            
            {#if column.filterOptions}
                <div class="filter-container">
                    <button 
                        class="action-button filter-button"
                        class:active={filterActive}
                        on:click={() => showFilterMenu = !showFilterMenu}
                        aria-label={`Filter ${column.label}`}
                    >
                        <i class="fas fa-filter"></i>
                    </button>
                    
                    {#if showFilterMenu}
                        <div class="filter-menu" transition:slide>
                            <FilterMenu
                                options={column.filterOptions}
                                on:filter={handleFilter}
                            />
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</th>

<style>
    .header-cell {
        position: relative;
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        color: #495057;
        background: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
        user-select: none;
    }

    .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        background: transparent;
        color: #6c757d;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-button:hover {
        background: #e9ecef;
        color: #0d6efd;
    }

    .action-button.active {
        color: #0d6efd;
    }

    .filter-container {
        position: relative;
    }

    .filter-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.25rem;
        z-index: 1000;
    }

    @media (max-width: 768px) {
        .header-cell {
            padding: 0.5rem;
        }

        .action-button {
            width: 20px;
            height: 20px;
        }
    }
</style>
