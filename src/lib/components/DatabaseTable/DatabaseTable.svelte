<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import type { DatabaseTableConfig, FilterState, SortState } from './types';
    import TableHeader from './TableHeader.svelte';
    import TableRow from './TableRow.svelte';
    import EditModal from './EditModal.svelte';
    import TableMilestones from './TableMilestones.svelte';
    import TableFilters from './TableFilters.svelte';
    import { user } from '$lib/auth';
    import type { SupabaseClient } from '$lib/supabase';

    export let config: DatabaseTableConfig;
    export let supabase: SupabaseClient;
    export let initialData: any[] = [];
    export let onDataChange: (data: any[]) => void = () => {};

    const dispatch = createEventDispatcher();

    let data = [...initialData];
    let loading = true;
    let error: string | null = null;
    let filteredData: any[] = [];
    let currentPage = 1;
    let searchTerm = '';
    let filterState: FilterState = {};
    let sortState: SortState | null = null;
    let showEditModal = false;
    let editingRow: any = null;
    let selectedRows = new Set<string>();
    let columnWidths: { [key: string]: number } = {};
    let draggedRow: any = null;
    let dragOverRow: any = null;
    let paginatedData: any[] = [];

    $: {
        data = [...initialData];
        applyFiltersAndSort();
    }

    $: {
        if (filteredData.length > 0) {
            dispatch('dataChange', filteredData);
        }
    }

    $: pageSize = config.pageSize || 10;
    $: totalPages = Math.ceil(filteredData.length / pageSize);
    
    // Make pagination reactive
    $: {
        // Ensure currentPage is within bounds
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        if (currentPage < 1) {
            currentPage = 1;
        }
        // Update paginatedData whenever currentPage, pageSize, or filteredData changes
        paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }

    onMount(async () => {
        if (initialData.length === 0) {
            loading = true;
            try {
                let query = supabase
                    .from(config.tableName)
                    .select('*');

                if (config.defaultSort) {
                    query = query.order(config.defaultSort.column, {
                        ascending: config.defaultSort.direction === 'asc'
                    });
                }

                const { data: fetchedData, error: err } = await query;

                if (err) {
                    error = err.message;
                    return;
                }

                data = fetchedData || [];
                applyFiltersAndSort();
            } catch (err) {
                error = err instanceof Error ? err.message : 'An error occurred';
            } finally {
                loading = false;
            }
        }
    });

    function handleDragStart(event: DragEvent, row: any) {
        if (!(event.target instanceof HTMLElement)) return;
        event.target.classList.add('dragging');
        draggedRow = row;
    }

    function handleDragEnd(event: DragEvent) {
        if (!(event.target instanceof HTMLElement)) return;
        event.target.classList.remove('dragging');
        draggedRow = null;
        dragOverRow = null;
    }

    function handleDragOver(event: DragEvent, row: any) {
        if (!(event.target instanceof HTMLElement)) return;
        event.preventDefault();
        if (!draggedRow || draggedRow.id === row.id) return;

        const rect = event.target.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        if (event.clientY < midY) {
            event.target.classList.add('drag-above');
            event.target.classList.remove('drag-below');
        } else {
            event.target.classList.add('drag-below');
            event.target.classList.remove('drag-above');
        }

        dragOverRow = row;
    }

    function handleDragLeave(event: DragEvent) {
        if (!(event.target instanceof HTMLElement)) return;
        event.target.classList.remove('drag-above', 'drag-below');
    }

    async function handleDrop(event: DragEvent, targetRow: any) {
        event.preventDefault();
        if (!draggedRow || draggedRow.id === targetRow.id) return;

        const draggedRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const draggedMiddle = draggedRect.top + draggedRect.height / 2;
        const isAbove = event.clientY < draggedMiddle;

        // Calculate new position
        const allRows = [...data].sort((a, b) => a.position - b.position);
        const draggedIndex = allRows.findIndex(row => row.id === draggedRow.id);
        const targetIndex = allRows.findIndex(row => row.id === targetRow.id);
        
        // Remove dragged row
        allRows.splice(draggedIndex, 1);
        
        // Insert at new position
        const newIndex = isAbove ? targetIndex : targetIndex + 1;
        allRows.splice(newIndex, 0, draggedRow);

        // Update positions while preserving all other fields
        const updatedRows = allRows.map((row, index) => ({
            ...row,
            position: (index + 1) * 1000
        }));

        // Update database
        try {
            // Update each row individually to preserve all fields
            const updates = updatedRows.map(row => 
                supabase
                    .from(config.tableName)
                    .update({ position: row.position })
                    .eq('id', row.id)
            );

            const results = await Promise.all(updates);
            const errors = results.filter(result => result.error);
            
            if (errors.length > 0) {
                throw errors[0].error;
            }

            // Update local data
            data = updatedRows;
            applyFiltersAndSort();
            onDataChange(data);
        } catch (err) {
            console.error('Error updating positions:', err);
            error = err.message;
        }

        // Clean up
        event.currentTarget?.classList.remove('drag-above', 'drag-below', 'dragging');
        draggedRow = null;
        dragOverRow = null;
    }

    function renderCell(column: any, row: any) {
        if (column.type === 'milestones') {
            return {
                component: TableMilestones,
                props: {
                    row,
                    tableName: config.tableName,
                    supabase
                }
            };
        }
        
        if (column.template) {
            return {
                html: column.template(row[column.id], row)
            };
        }

        // Handle URL type
        if (column.type === 'url' && row[column.id]) {
            return {
                html: `<a href="${row[column.id]}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-900">${row[column.id]}</a>`
            };
        }

        // Handle currency type
        if (column.type === 'currency' && row[column.id] != null) {
            return {
                text: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row[column.id])
            };
        }

        // Handle percentage type
        if (column.type === 'percentage' && row[column.id] != null) {
            return {
                text: `${row[column.id]}%`
            };
        }
        
        return {
            text: row[column.id]
        };
    }

    async function handleMilestoneUpdate(event: CustomEvent) {
        const { rowId, milestones } = event.detail;
        // Update local data
        data = data.map(row => 
            row.id === rowId ? { ...row, ...milestones } : row
        );
        applyFiltersAndSort();
        onDataChange(data);
    }

    function applyFiltersAndSort() {
        let result = [...data];

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(row => 
                Object.entries(row).some(([key, value]) => {
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(searchLower);
                    }
                    return false;
                })
            );
        }

        // Apply column filters
        Object.entries(filterState).forEach(([column, filter]) => {
            if (!filter) return;
            
            if (typeof filter === 'object' && 'operator' in filter && 'value' in filter) {
                const { operator, value } = filter;
                result = result.filter(row => {
                    const cellValue = row[column];
                    switch (operator) {
                        case 'eq': return cellValue === value;
                        case 'neq': return cellValue !== value;
                        case 'gt': return cellValue > value;
                        case 'gte': return cellValue >= value;
                        case 'lt': return cellValue < value;
                        case 'lte': return cellValue <= value;
                        case 'like': return String(cellValue).includes(String(value));
                        case 'ilike': return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
                        case 'in': return Array.isArray(value) && value.includes(cellValue);
                        default: return true;
                    }
                });
            }
        });

        // Apply sorting
        if (sortState) {
            const { column, direction } = sortState;
            result.sort((a, b) => {
                const aVal = a[column];
                const bVal = b[column];
                const modifier = direction === 'asc' ? 1 : -1;
                
                if (aVal < bVal) return -1 * modifier;
                if (aVal > bVal) return 1 * modifier;
                return 0;
            });
        }

        filteredData = result;
        // Reset to first page when filters change
        currentPage = 1;
    }

    async function handleAdd() {
        editingRow = {
            user_id: $user?.id, // Set user_id for new records
            localid: crypto.randomUUID() // Generate localid for new records using Web Crypto API
        };
        showEditModal = true;
    }

    async function handleEdit(row: any) {
        if (!(event?.target instanceof HTMLElement)) return;
        event.target.classList.add('editing');
        editingRow = { ...row };
        showEditModal = true;
    }

    async function handleDelete(row: any) {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const { error: err } = await supabase
                .from(config.tableName)
                .delete()
                .eq('id', row.id);

            if (err) throw err;

            data = data.filter(item => item.id !== row.id);
            applyFiltersAndSort();
        } catch (err) {
            error = err instanceof Error ? err.message : 'An error occurred';
        }
    }

    async function handleSave(updatedRow: any) {
        try {
            const { data: savedData, error: err } = await supabase
                .from(config.tableName)
                .update(updatedRow)
                .eq('id', updatedRow.id)
                .select()
                .single();

            if (err) throw err;

            data = data.map(item => 
                item.id === savedData.id ? savedData : item
            );
            applyFiltersAndSort();
            showEditModal = false;
        } catch (err) {
            error = err instanceof Error ? err.message : 'An error occurred';
        }
    }

    function handleSort(column: string) {
        if (sortState?.column === column) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortState = { column, direction: 'asc' };
        }
        applyFiltersAndSort();
    }

    function handleFilter(column: string, operator: FilterState['operator'], value: any) {
        const filterIndex = Object.keys(filterState).findIndex(f => f === column);
        if (filterIndex >= 0) {
            filterState[column] = { operator, value };
        } else {
            filterState[column] = { operator, value };
        }
        applyFiltersAndSort();
    }

    function clearFilter(column: string) {
        delete filterState[column];
        applyFiltersAndSort();
    }

    function handleExport() {
        const csv = [
            config.columns.map(col => col.label).join(','),
            ...filteredData.map(row => 
                config.columns.map(col => {
                    const value = row[col.id];
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${config.tableName}_export.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function handleSelectAll() {
        if (selectedRows.size === paginatedData.length) {
            selectedRows.clear();
        } else {
            paginatedData.forEach(row => selectedRows.add(row.id));
        }
        selectedRows = selectedRows;
    }

    function handleSelect(rowId: string) {
        if (selectedRows.has(rowId)) {
            selectedRows.delete(rowId);
        } else {
            selectedRows.add(rowId);
        }
        selectedRows = selectedRows;
    }

    function handleColumnResize(event: CustomEvent) {
        const { column, width } = event.detail;
        columnWidths[column] = width;
    }

    async function moveProject(id: string, fromTable: string, toTable: string) {
        try {
            const { error: moveError } = await supabase
                .from(fromTable)
                .delete()
                .eq('id', id);

            if (moveError) throw moveError;

            const project = data.find(row => row.id === id);
            if (!project) return;

            const { data: savedData, error: saveError } = await supabase
                .from(toTable)
                .insert([project]);

            if (saveError) throw saveError;

            // Update local data
            data = data.filter(row => row.id !== id);
            applyFiltersAndSort();
            onDataChange(data);
        } catch (err) {
            console.error('Error moving project:', err);
            error = err.message;
        }
    }

    function showAnalytics(row: any) {
        // TO DO: Implement analytics functionality
    }

    function handleRowAction(action: string, row: any) {
        dispatch('rowAction', { action, row });
    }
</script>

<div class="database-table" transition:fade>
    {#if error}
        <div class="error-message" transition:slide>
            {error}
        </div>
    {/if}

    <div class="table-container">
        <div class="table-toolbar">
            {#if config.features?.search}
                <div class="search-box">
                    <input
                        type="text"
                        placeholder="Search..."
                        bind:value={searchTerm}
                        on:input={applyFiltersAndSort}
                        aria-label="Search input"
                    />
                </div>
            {/if}
            
            <div class="toolbar-actions">
                {#if config.features?.add && config.permissions?.canAdd}
                    <button 
                        class="btn btn-primary" 
                        on:click={handleAdd}
                        aria-label="Add new record"
                    >
                        <i class="fas fa-plus"></i> Add New
                    </button>
                {/if}
            </div>
        </div>

        <div class="table-wrapper">
            <table class="min-w-full table-fixed">
                <TableHeader
                    columns={config.columns}
                    sortState={sortState}
                    config={config}
                    selectable={config.features?.select}
                    onSort={handleSort}
                    on:selectAll={handleSelectAll}
                    on:columnResize={handleColumnResize}
                />
                <tbody>
                    {#each paginatedData as row (row.id)}
                        <tr
                            draggable="true"
                            on:dragstart={(event) => handleDragStart(event, row)}
                            on:dragover={(event) => handleDragOver(event, row)}
                            on:dragleave={handleDragLeave}
                            on:drop={(event) => handleDrop(event, row)}
                            on:dragend={handleDragEnd}
                            transition:fade|local
                            class:selected={selectedRows.has(row.id)}
                            class:dragging={draggedRow?.id === row.id}
                            class:drag-target={dragOverRow?.id === row.id}
                        >
                            {#if config.features?.select}
                                <td class="w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.has(row.id)}
                                        on:change={() => handleSelect(row.id)}
                                        aria-label="Select row"
                                    />
                                </td>
                            {/if}
                            
                            {#each config.columns as column}
                                <td style={`width: ${columnWidths[column.id] || column.width || 'auto'}`}>
                                    {#if column.type === 'milestones'}
                                        <TableMilestones
                                            row={row}
                                            tableName={config.tableName}
                                            supabase={supabase}
                                            on:milestoneUpdate={handleMilestoneUpdate}
                                            on:error={(e) => error = e.detail.message}
                                        />
                                    {:else}
                                        {#if column.template}
                                            {@html column.template(row[column.id], row)}
                                        {:else if column.type === 'url' && row[column.id]}
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
                                    {/if}
                                </td>
                            {/each}

                            {#if config.features?.edit || config.features?.delete || config.actions}
                                <td class="action-cell">
                                    <div class="action-buttons">
                                        {#if config.features?.edit && config.permissions?.canEdit(row)}
                                            <button 
                                                class="action-button edit-button" 
                                                on:click={() => handleEdit(row)}
                                                aria-label="Edit row"
                                            >
                                                <i class="fas fa-pen-to-square" aria-hidden="true"></i>
                                            </button>
                                        {/if}

                                        {#if config.tableName === 'active_projects'}
                                            <button 
                                                class="action-button move-button" 
                                                on:click={() => moveProject(row.id, 'active_projects', 'mentor_to_launch_projects')}
                                                aria-label="Move to Mentor Projects"
                                            >
                                                <i class="fas fa-arrow-down" aria-hidden="true"></i>
                                            </button>
                                        {:else if config.tableName === 'mentor_to_launch_projects'}
                                            <button 
                                                class="action-button move-button" 
                                                on:click={() => moveProject(row.id, 'mentor_to_launch_projects', 'active_projects')}
                                                aria-label="Move to Active Projects"
                                            >
                                                <i class="fas fa-arrow-up" aria-hidden="true"></i>
                                            </button>
                                        {/if}

                                        <button 
                                            class="action-button analytics-button" 
                                            on:click={() => showAnalytics(row)}
                                            aria-label="View analytics"
                                        >
                                            <i class="fas fa-chart-line" aria-hidden="true"></i>
                                        </button>
                                        
                                        {#if config.features?.delete && config.permissions?.canDelete(row)}
                                            <button 
                                                class="action-button delete-button"
                                                on:click={() => handleDelete(row)}
                                                aria-label="Delete row"
                                            >
                                                <i class="fas fa-trash-can" aria-hidden="true"></i>
                                            </button>
                                        {/if}
                                    </div>
                                </td>
                            {/if}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        {#if config.features?.pagination}
            <div class="pagination">
                <button 
                    class="page-button"
                    disabled={currentPage === 1}
                    on:click={() => currentPage = 1}
                    aria-label="Go to first page"
                >
                    <i class="fas fa-angle-double-left" aria-hidden="true"></i>
                </button>
                <button 
                    class="page-button"
                    disabled={currentPage === 1}
                    on:click={() => currentPage--}
                    aria-label="Go to previous page"
                >
                    <i class="fas fa-angle-left" aria-hidden="true"></i>
                </button>
                <span class="page-info">
                    Page {currentPage} of {totalPages}
                </span>
                <button 
                    class="page-button"
                    disabled={currentPage === totalPages}
                    on:click={() => currentPage++}
                    aria-label="Go to next page"
                >
                    <i class="fas fa-angle-right" aria-hidden="true"></i>
                </button>
                <button 
                    class="page-button"
                    disabled={currentPage === totalPages}
                    on:click={() => currentPage = totalPages}
                    aria-label="Go to last page"
                >
                    <i class="fas fa-angle-double-right" aria-hidden="true"></i>
                </button>
            </div>
        {/if}
    </div>

    {#if showEditModal}
        <EditModal
            config={config}
            row={editingRow}
            on:save={handleSave}
            on:close={() => showEditModal = false}
        />
    {/if}
</div>

<style>
    .database-table {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(-1 * (env(safe-area-inset-left, 0px)));
    margin-right: calc(-1 * (env(safe-area-inset-right, 0px)));
    background: white;
    border-radius: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: 0;
}

.table-container {
    overflow: hidden;
    border-radius: 0;
    padding: 0;
}

.table-wrapper {
    overflow-x: auto;
    position: relative;
    -webkit-overflow-scrolling: touch;
    max-width: 100vw;
    width: 100vw;
    margin: 0;
    padding: 0;
}

table {
    width: 100vw;
    min-width: 600px;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.95rem;
    background: white;
}

td, th {
    padding: 1rem 0.5rem;
    vertical-align: middle;
    border-bottom: 1px solid #e2e8f0;
    white-space: normal;
    word-wrap: break-word;
}

.action-buttons button, .action-cell button {
    min-width: 44px;
    min-height: 44px;
    font-size: 1.2em;
    margin: 0 0.25rem;
    border-radius: 8px;
}

@media (max-width: 640px) {
    .database-table,
    .table-container,
    .table-wrapper,
    table {
        width: 100vw !important;
        max-width: 100vw !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    th, td {
        padding: 0.75rem 0.25rem;
        font-size: 1rem;
    }
    .action-buttons button, .action-cell button {
        min-width: 44px;
        min-height: 44px;
        font-size: 1.25em;
        margin: 0 0.15rem;
        border-radius: 8px;
    }
}

    @media (max-width: 768px) {
        table {
            font-size: 0.8125rem;
        }

        td, th {
            padding: 0.5rem 0.25rem;
            min-width: 0;
            max-width: none;
        }

        /* Hide less important columns on mobile */
        .hide-mobile {
            display: none;
        }

        /* Ensure content wraps on mobile */
        td > div, th > div {
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Allow certain columns to wrap text */
        td.wrap-content > div, th.wrap-content > div {
            white-space: normal;
            word-wrap: break-word;
        }

        /* Make action buttons more compact */
        .action-buttons {
            gap: 0.25rem;
        }

        .action-button {
            width: 1.75rem;
            height: 1.75rem;
        }
    }

    .action-cell {
        padding: 0.5rem !important;
        white-space: nowrap;
        width: 1%;
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        align-items: center;
    }

    .action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border: none;
        border-radius: 0.375rem;
        background: transparent;
        color: #4a5568;
        transition: all 0.2s;
        cursor: pointer;
    }

    .action-button:hover {
        background: #f7fafc;
        transform: translateY(-1px);
    }

    .edit-button:hover {
        color: #4299e1;
    }

    .move-button:hover {
        color: #48bb78;
    }

    .analytics-button:hover {
        color: #9f7aea;
    }

    .delete-button:hover {
        color: #f56565;
    }

    .action-button i {
        font-size: 1rem;
    }

    .action-button {
        position: relative;
    }

    .action-button:hover::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.25rem 0.5rem;
        background: #1a202c;
        color: white;
        font-size: 0.75rem;
        border-radius: 0.25rem;
        white-space: nowrap;
        pointer-events: none;
        z-index: 10;
    }

    .search-box {
        position: relative;
        margin-bottom: 0.75rem;
    }

    .search-box input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }

    .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        padding: 0.75rem;
        border-top: 1px solid #e2e8f0;
        flex-wrap: wrap;
    }

    .page-button {
        padding: 0.375rem;
        border-radius: 0.375rem;
        color: #64748b;
        transition: all 0.2s;
        min-width: 32px;
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .page-info {
        color: #64748b;
        font-size: 0.75rem;
        padding: 0 0.5rem;
    }

    .toolbar-actions {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
    }

@media (min-width: 640px) {
    table {
        font-size: 1rem;
    }
    td {
        padding: 0.75rem 1rem;
    }
    .action-cell {
        width: 150px;
    }
    .action-buttons {
        gap: 0.5rem;
    }
    .action-button {
        padding: 0.5rem;
    }
    .pagination {
        gap: 0.5rem;
        padding: 1rem;
    }
    .page-info {
        font-size: 0.875rem;
    }
    .toolbar-actions {
        gap: 0.5rem;
    }
    .btn {
        padding: 0.5rem 1rem;
    }
}

    @media (max-width: 639px) {
        .hide-on-mobile {
            display: none;
        }
    }

    .dragging {
        opacity: 0.5;
    }

    .drag-above {
        border-top: 2px solid #4a5568;
    }

    .drag-below {
        border-bottom: 2px solid #4a5568;
    }
</style>
