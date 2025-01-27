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
                class:hide-mobile={column.hideMobile}
                class:wrap-content={column.wrap}
                data-column-id={column.id}
                style="width: {columnWidths[column.id] || column.width || 'auto'}"
            >
                <div class="header-content">
                    <span class="header-text">{column.label}</span>
                    {#if column.sortable !== false}
                        <button 
                            class="sort-button" 
                            on:click={() => handleSortClick(column)}
                            title="Sort by {column.label}"
                        >
                            <i class="fas fa-sort{sortState?.column === column.id ? (sortState.direction === 'asc' ? '-up' : '-down') : ''}"></i>
                        </button>
                    {/if}
                </div>
                {#if column.resizable !== false}
                    <div
                        class="resize-handle"
                        on:mousedown={(e) => handleMouseDown(e, column.id)}
                    ></div>
                {/if}
            </th>
        {/each}

        {#if config.features?.edit || config.features?.delete || config.actions}
            <th class="action-cell">Actions</th>
        {/if}
    </tr>
</thead>

<style>
    th {
        position: relative;
        padding: 0.75rem 0.5rem;
        text-align: left;
        font-weight: 600;
        color: #4a5568;
        background: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
        user-select: none;
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .header-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .sort-button {
        padding: 0.25rem;
        background: transparent;
        border: none;
        color: #a0aec0;
        cursor: pointer;
        transition: color 0.2s;
    }

    .sort-button:hover {
        color: #4a5568;
    }

    th.sorted .sort-button {
        color: #4a5568;
    }

    .resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        background: transparent;
        transition: background 0.2s;
    }

    .resize-handle:hover,
    th.resizing .resize-handle {
        background: #e2e8f0;
    }

    @media (max-width: 768px) {
        th {
            padding: 0.5rem 0.25rem;
            font-size: 0.8125rem;
        }

        .sort-button {
            padding: 0.125rem;
        }

        .resize-handle {
            display: none;
        }
    }
</style>
