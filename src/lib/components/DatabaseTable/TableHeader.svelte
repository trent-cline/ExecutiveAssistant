<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Column, SortState } from './types';

    export let columns: Column[];
    export let sortState: SortState | null;
    export let selectable = false;
    export let onSort: (column: string) => void;
    export let config: any;

    const dispatch = createEventDispatcher();
    let resizingColumn: string | null = null;
    let startX: number;
    let startWidth: number;
    let columnWidths: { [key: string]: string } = {};

    // Initialize column widths
    $: {
        columns.forEach(col => {
            if (!columnWidths[col.id] && col.width) {
                columnWidths[col.id] = col.width;
            }
        });
    }

    function handleMouseDown(e: MouseEvent, columnId: string) {
        e.preventDefault();
        e.stopPropagation();
        resizingColumn = columnId;
        startX = e.pageX;

        const headerCell = (e.target as HTMLElement).closest('th');
        if (headerCell) {
            startWidth = headerCell.offsetWidth;
            
            // Add event listeners to document
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Add resize class to body
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
    }

    function handleMouseMove(e: MouseEvent) {
        if (!resizingColumn) return;

        const diff = e.pageX - startX;
        const newWidth = Math.max(50, startWidth + diff);
        columnWidths[resizingColumn] = `${newWidth}px`;

        // Force Svelte to update by reassigning the object
        columnWidths = { ...columnWidths };
    }

    function handleMouseUp() {
        if (resizingColumn) {
            document.body.style.removeProperty('cursor');
            document.body.style.removeProperty('user-select');
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Dispatch event with new column width
            dispatch('columnResize', {
                columnId: resizingColumn,
                width: columnWidths[resizingColumn]
            });
            
            resizingColumn = null;
        }
    }

    function handleSortClick(column: Column) {
        if (column.sortable !== false) {
            onSort(column.id);
        }
    }
</script>

<thead>
    <tr>
        {#if selectable}
            <th class="w-10">
                <input
                    type="checkbox"
                    on:change={(e) => dispatch('selectAll', e.target.checked)}
                />
            </th>
        {/if}

        {#each columns as column}
            <th 
                class:sortable={column.sortable !== false}
                class:sorted={sortState?.column === column.id}
                class:asc={sortState?.direction === 'asc'}
                class:resizing={resizingColumn === column.id}
                data-column-id={column.id}
                style="width: {columnWidths[column.id] || column.width || 'auto'}"
            >
                <div class="th-content" on:click={() => handleSortClick(column)}>
                    {column.label}
                    {#if column.sortable !== false}
                        <span class="sort-icon">
                            {#if sortState?.column === column.id}
                                <i class="fas fa-sort-{sortState.direction === 'asc' ? 'up' : 'down'}"></i>
                            {:else}
                                <i class="fas fa-sort"></i>
                            {/if}
                        </span>
                    {/if}
                </div>
                <div 
                    class="resize-handle"
                    on:mousedown|stopPropagation={(e) => handleMouseDown(e, column.id)}
                ></div>
            </th>
        {/each}

        {#if config?.features?.edit || config?.features?.delete || config?.customActions}
            <th class="actions-header">Actions</th>
        {/if}
    </tr>
</thead>

<style>
    th {
        position: relative;
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #1f2937;
        background-color: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
        user-select: none;
    }

    .th-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: default;
        pointer-events: auto;
    }

    .sortable .th-content {
        cursor: pointer;
    }

    .sort-icon {
        color: #94a3b8;
    }

    .sorted .sort-icon {
        color: #3b82f6;
    }

    .resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 4px;
        background-color: transparent;
        cursor: col-resize;
        transition: background-color 0.2s;
        z-index: 10;
    }

    .resize-handle:hover,
    .resizing .resize-handle {
        background-color: #3b82f6;
    }

    th:hover .resize-handle {
        background-color: #e2e8f0;
    }

    .actions-header {
        width: 150px;
        text-align: center;
    }

    .resizing {
        background-color: #f1f5f9;
    }
</style>
