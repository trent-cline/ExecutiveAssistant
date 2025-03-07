<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import type { DatabaseTableConfig, FilterState, FilterOperator } from './types';

    export let config: DatabaseTableConfig;
    export let filters: FilterState[] = [];

    const dispatch = createEventDispatcher<{
        filter: FilterState;
        clearFilter: string;
    }>();

    let showFilters = false;
    let activeColumn: string | null = null;

    const operators = [
        { value: 'eq', label: 'Equals' },
        { value: 'neq', label: 'Not Equals' },
        { value: 'gt', label: 'Greater Than' },
        { value: 'gte', label: 'Greater Than or Equal' },
        { value: 'lt', label: 'Less Than' },
        { value: 'lte', label: 'Less Than or Equal' },
        { value: 'like', label: 'Contains' },
        { value: 'ilike', label: 'Contains (Case Insensitive)' }
    ] as const;

    function getFilterForColumn(column: string): FilterState | undefined {
        return filters.find(f => f.column === column);
    }

    function handleFilterChange(column: string, operator: FilterOperator, value: string | number) {
        const filterState: FilterState = {
            column,
            operator,
            value
        };
        dispatch('filter', filterState);
    }
</script>

<div class="filters-container">
    <button
        class="btn btn-secondary"
        class:active={showFilters}
        on:click={() => (showFilters = !showFilters)}
        aria-label="Toggle filters"
    >
        <i class="fas fa-filter" aria-hidden="true"></i>
        Filters
        {#if filters.length > 0}
            <span class="filter-count">{filters.length}</span>
        {/if}
    </button>

    {#if showFilters}
        <div class="filters-dropdown" transition:slide>
            {#each config.columns.filter(col => col.filterable) as column}
                <div class="filter-item">
                    <div class="filter-header">
                        <span>{column.label}</span>
                        {#if getFilterForColumn(column.id)}
                            <button
                                class="clear-filter"
                                on:click={() => dispatch('clearFilter', column.id)}
                                aria-label={`Clear filter by ${column.label}`}
                            >
                                <i class="fas fa-times" aria-hidden="true"></i>
                            </button>
                        {/if}
                    </div>

                    {#if column.filterOptions}
                        <select
                            value={getFilterForColumn(column.id)?.value || ''}
                            on:change={(e) => handleFilterChange(column.id, 'eq', e.currentTarget.value)}
                        >
                            <option value="">Select...</option>
                            {#each column.filterOptions as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    {:else}
                        <div class="filter-controls">
                            <select
                                value={getFilterForColumn(column.id)?.operator || 'eq'}
                                on:change={(e) => {
                                    const currentFilter = getFilterForColumn(column.id);
                                    const value = currentFilter?.value || '';
                                    handleFilterChange(column.id, e.currentTarget.value, value);
                                }}
                            >
                                {#each operators as op}
                                    <option value={op.value}>{op.label}</option>
                                {/each}
                            </select>

                            <input
                                type={column.type === 'number' ? 'number' : 'text'}
                                value={getFilterForColumn(column.id)?.value || ''}
                                on:input={(e) => {
                                    const currentFilter = getFilterForColumn(column.id);
                                    const operator = currentFilter?.operator || 'eq';
                                    handleFilterChange(
                                        column.id,
                                        operator,
                                        column.type === 'number' ? Number(e.currentTarget.value) : e.currentTarget.value
                                    );
                                }}
                            />
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .filters-container {
        position: relative;
        display: inline-block;
    }

    .filters-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        min-width: 300px;
        padding: 1rem;
        margin-top: 0.5rem;
        background: var(--color-surface-100);
        border: 1px solid var(--color-surface-300);
        border-radius: var(--theme-rounded-base);
        box-shadow: var(--theme-shadow-lg);
    }

    .filter-item {
        margin-bottom: 1rem;
    }

    .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .filter-controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .clear-filter {
        background: none;
        border: none;
        color: var(--color-error-500);
        cursor: pointer;
        padding: 0.25rem;
    }

    .clear-filter:hover {
        color: var(--color-error-700);
    }

    .filter-count {
        background: var(--color-primary-500);
        color: white;
        border-radius: 9999px;
        padding: 0.125rem 0.375rem;
        font-size: 0.75rem;
        margin-left: 0.5rem;
    }

    select, input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--color-surface-300);
        border-radius: var(--theme-rounded-base);
        background: var(--color-surface-100);
    }

    select:focus, input:focus {
        outline: none;
        border-color: var(--color-primary-500);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-500), 0.2);
    }
</style>
