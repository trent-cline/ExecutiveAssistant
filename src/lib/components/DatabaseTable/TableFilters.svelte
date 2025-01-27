<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { DatabaseTableConfig, FilterState } from './types';

    export let config: DatabaseTableConfig;
    export let filters: FilterState[] = [];

    const dispatch = createEventDispatcher();

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
    ];

    function getFilterForColumn(column: string) {
        return filters.find(f => f.column === column);
    }

    function handleFilterChange(column: string, operator: FilterState['operator'], value: any) {
        dispatch('filter', { column, operator, value });
    }
</script>

<div class="filters-container">
    <button
        class="btn btn-secondary"
        class:active={showFilters}
        on:click={() => showFilters = !showFilters}
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
                            on:change={(e) => handleFilterChange(column.id, 'eq', e.target.value)}
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
                                    if (currentFilter) {
                                        handleFilterChange(column.id, e.target.value as FilterState['operator'], currentFilter.value);
                                    }
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
                                    handleFilterChange(
                                        column.id,
                                        currentFilter?.operator || 'eq',
                                        column.type === 'number' ? Number(e.target.value) : e.target.value
                                    );
                                }}
                                placeholder="Filter value..."
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
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .btn-secondary {
        background-color: #e2e8f0;
        color: #475569;
    }

    .btn.active {
        background-color: #cbd5e1;
    }

    .filter-count {
        background-color: #3b82f6;
        color: white;
        padding: 0.125rem 0.375rem;
        border-radius: 9999px;
        font-size: 0.75rem;
    }

    .filters-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;
        min-width: 300px;
        margin-top: 0.5rem;
        padding: 1rem;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .filter-item {
        margin-bottom: 1rem;
    }

    .filter-item:last-child {
        margin-bottom: 0;
    }

    .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #475569;
    }

    .clear-filter {
        padding: 0.25rem;
        color: #94a3b8;
        cursor: pointer;
    }

    .clear-filter:hover {
        color: #64748b;
    }

    .filter-controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    select, input {
        width: 100%;
        padding: 0.375rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }

    select:focus, input:focus {
        outline: none;
        border-color: #3b82f6;
        ring: 2px solid #bfdbfe;
    }
</style>
