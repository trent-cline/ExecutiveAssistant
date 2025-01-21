<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import type { DatabaseTableProps, FilterState, SortState } from './types';
    import TableHeader from './TableHeader.svelte';
    import TableRow from './TableRow.svelte';
    import EditModal from './EditModal.svelte';
    import TableMilestones from './TableMilestones.svelte';
    import TableFilters from './TableFilters.svelte';

    export let config: DatabaseTableProps;
    export let supabase: any;
    export let initialData: any[] = [];
    export let onDataChange: (data: any[]) => void = () => {};

    const dispatch = createEventDispatcher();

    let data = initialData;
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

    $: pageSize = config.pageSize || 10;
    $: totalPages = Math.ceil(filteredData.length / pageSize);
    $: paginatedData = getPaginatedData(filteredData);

    onMount(async () => {
        if (initialData.length === 0) {
            await fetchData();
        } else {
            loading = false;
            applyFiltersAndSort();
        }
    });

    async function fetchData() {
        try {
            loading = true;
            error = null;
            let query = supabase.from(config.tableName).select('*');
            
            const { data: fetchedData, error: fetchError } = await query;
            
            if (fetchError) throw fetchError;
            
            data = fetchedData;
            applyFiltersAndSort();
            onDataChange(data);
        } catch (err) {
            console.error('Error fetching data:', err);
            error = err.message;
        } finally {
            loading = false;
        }
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
        data = data.map(row => {
            if (row.id === rowId) {
                return { ...row, ...milestones };
            }
            return row;
        });
        applyFiltersAndSort();
        onDataChange(data);
    }

    function applyFiltersAndSort() {
        filteredData = data.filter(row => {
            if (!searchTerm) return true;
            return config.columns.some(col => {
                const value = row[col.id];
                return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });

        if (sortState) {
            filteredData = [...filteredData].sort((a, b) => {
                const aVal = a[sortState.column];
                const bVal = b[sortState.column];
                const direction = sortState.direction === 'asc' ? 1 : -1;
                
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return (aVal - bVal) * direction;
                }
                return String(aVal).localeCompare(String(bVal)) * direction;
            });
        }
    }

    function getPaginatedData(data: any[]) {
        return data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }

    async function handleAdd() {
        editingRow = {};
        showEditModal = true;
    }

    async function handleEdit(row: any) {
        editingRow = { ...row };
        showEditModal = true;
    }

    async function handleDelete(row: any) {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const { error: deleteError } = await supabase
                .from(config.tableName)
                .delete()
                .match({ id: row.id });

            if (deleteError) throw deleteError;
            
            await fetchData();
            dispatch('delete', { row });
        } catch (err) {
            console.error('Error deleting record:', err);
            error = err.message;
        }
    }

    async function handleSave(formData: any) {
        try {
            const isEdit = 'id' in formData;
            const { error: saveError } = isEdit
                ? await supabase
                    .from(config.tableName)
                    .update(formData)
                    .match({ id: formData.id })
                : await supabase
                    .from(config.tableName)
                    .insert([formData]);

            if (saveError) throw saveError;

            showEditModal = false;
            await fetchData();
            dispatch(isEdit ? 'edit' : 'add', { row: formData });
        } catch (err) {
            console.error('Error saving record:', err);
            error = err.message;
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
                    return typeof value === 'string' && value.includes(',')
                        ? `"${value}"`
                        : value;
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
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        bind:value={searchTerm}
                        on:input={() => applyFiltersAndSort()}
                        placeholder="Search..."
                    />
                </div>
            {/if}

            {#if config.features?.filter}
                <TableFilters
                    columns={config.columns.filter(col => col.filterable)}
                    {filterState}
                    on:filter={({ detail }) => {
                        filterState = detail;
                        applyFiltersAndSort();
                    }}
                />
            {/if}

            <div class="toolbar-actions">
                {#if config.features?.add && config.permissions?.canAdd}
                    <button class="btn btn-primary" on:click={handleAdd}>
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New
                    </button>
                {/if}

                {#if config.features?.export}
                    <button class="btn btn-secondary" on:click={handleExport}>
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                {/if}
            </div>
        </div>

        <div class="table-wrapper">
            <table class="min-w-full">
                <TableHeader
                    columns={config.columns}
                    {sortState}
                    selectable={config.features?.select}
                    allSelected={selectedRows.size === paginatedData.length}
                    on:sort={handleSort}
                    on:selectAll={handleSelectAll}
                />
                
                <tbody>
                    {#each paginatedData as row (row.id)}
                        <tr transition:fade|local>
                            {#if config.features?.select}
                                <td class="w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.has(row.id)}
                                        on:change={() => handleSelect(row.id)}
                                    />
                                </td>
                            {/if}
                            
                            {#each config.columns as column}
                                {#if column.type === 'milestones'}
                                    <td>
                                        <TableMilestones
                                            row={row}
                                            tableName={config.tableName}
                                            {supabase}
                                            on:milestoneUpdate={handleMilestoneUpdate}
                                            on:error={(e) => error = e.detail.message}
                                        />
                                    </td>
                                {:else}
                                    <td>
                                        {#if column.template}
                                            {@html column.template(row[column.id], row)}
                                        {:else if column.type === 'url' && row[column.id]}
                                            <a 
                                                href={row[column.id]} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                class="text-blue-600 hover:text-blue-900"
                                            >
                                                {row[column.id]}
                                            </a>
                                        {:else if column.type === 'currency' && row[column.id] != null}
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row[column.id])}
                                        {:else if column.type === 'percentage' && row[column.id] != null}
                                            {row[column.id]}%
                                        {:else}
                                            {row[column.id]}
                                        {/if}
                                    </td>
                                {/if}
                            {/each}

                            {#if config.features?.edit || config.features?.delete || config.customActions}
                                <td class="action-cell">
                                    {#if config.features?.edit && config.permissions?.canEdit(row)}
                                        <button class="action-button edit-button" on:click={() => handleEdit(row)}>
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-1.073-5.73-4.412 4.412-4.412-4.412 4.412-4.412 4.412 4.412-1.073-1.073-1.073 1.073z" />
                                            </svg>
                                        </button>
                                    {/if}
                                    
                                    {#if config.features?.delete && config.permissions?.canDelete(row)}
                                        <button class="action-button delete-button" on:click={() => handleDelete(row.id)}>
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    {/if}

                                    {#if config.customActions}
                                        {#each config.customActions as action}
                                            <button 
                                                class="action-button move-button"
                                                on:click={() => action.handler(row)}
                                            >
                                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4H9m5 8V5a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V9" />
                                                </svg>
                                            </button>
                                        {/each}
                                    {/if}
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
                    class="pagination-btn"
                    disabled={currentPage === 1}
                    on:click={() => currentPage = 1}
                >
                    First
                </button>
                <button 
                    class="pagination-btn"
                    disabled={currentPage === 1}
                    on:click={() => currentPage--}
                >
                    Previous
                </button>
                
                <span class="page-info">
                    Page {currentPage} of {totalPages}
                </span>
                
                <button 
                    class="pagination-btn"
                    disabled={currentPage === totalPages}
                    on:click={() => currentPage++}
                >
                    Next
                </button>
                <button 
                    class="pagination-btn"
                    disabled={currentPage === totalPages}
                    on:click={() => currentPage = totalPages}
                >
                    Last
                </button>
            </div>
        {/if}
    </div>

    {#if showEditModal}
        <EditModal
            {config}
            row={editingRow}
            on:save={handleSave}
            on:close={() => showEditModal = false}
        />
    {/if}
</div>

<style>
    .database-table {
        width: 100%;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    /* Mobile-first toolbar */
    .table-toolbar {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
        gap: 1rem;
    }

    @media (min-width: 768px) {
        .table-toolbar {
            flex-direction: row;
            align-items: center;
            flex-wrap: wrap;
        }
    }

    /* Mobile-first search box */
    .search-box {
        position: relative;
        width: 100%;
    }

    @media (min-width: 768px) {
        .search-box {
            flex: 1;
            min-width: auto;
            max-width: 300px;
        }
    }

    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1.25rem;
        height: 1.25rem;
        color: #64748b;
    }

    .search-box input {
        width: 100%;
        padding: 0.75rem 1rem;
        padding-left: 2.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        font-size: 1rem;
    }

    /* Mobile-first action buttons */
    .toolbar-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.75rem;
        width: 100%;
    }

    @media (min-width: 768px) {
        .toolbar-actions {
            display: flex;
            width: auto;
        }
    }

    /* Mobile-first table container */
    .table-container {
        position: relative;
    }

    /* Card view for mobile */
    @media (max-width: 767px) {
        table, thead, tbody, tr {
            display: block;
        }

        thead {
            display: none;
        }

        tr {
            margin-bottom: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 1rem;
        }

        td {
            display: grid;
            grid-template-columns: 120px 1fr;
            padding: 0.5rem 0;
            border: none;
        }

        td::before {
            content: attr(data-label);
            font-weight: 500;
            color: #475569;
        }
    }

    /* Desktop table styles */
    @media (min-width: 768px) {
        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }

        :global(.database-table td),
        :global(.database-table th) {
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            border-left: none;
        }

        :global(.database-table td:first-child),
        :global(.database-table th:first-child) {
            border-left: 1px solid #e2e8f0;
        }

        :global(.database-table tr) {
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.2s;
        }

        :global(.database-table tbody tr:hover) {
            background-color: #f8fafc;
        }

        :global(.database-table th) {
            background-color: #f8fafc;
            font-weight: 500;
            color: #475569;
            position: sticky;
            top: 0;
            z-index: 10;
            border-bottom: 2px solid #e2e8f0;
        }

        /* Action column styles */
        :global(.action-cell) {
            padding: 0.5rem !important;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            min-width: 120px;
        }

        :global(.action-button) {
            padding: 0.5rem;
            border-radius: 0.375rem;
            border: none;
            background: none;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        :global(.action-button:hover) {
            color: #1e293b;
            background-color: #f1f5f9;
        }

        :global(.edit-button:hover) {
            color: #3b82f6;
        }

        :global(.delete-button:hover) {
            color: #ef4444;
        }

        :global(.move-button:hover) {
            color: #8b5cf6;
        }
    }

    /* Mobile-first pagination */
    .pagination {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        gap: 0.75rem;
    }

    @media (min-width: 768px) {
        .pagination {
            flex-direction: row;
            justify-content: center;
            gap: 0.5rem;
        }
    }

    .page-info {
        margin: 0.5rem;
        color: #64748b;
        font-size: 1rem;
    }

    /* Mobile-friendly buttons */
    .btn {
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        min-height: 44px; /* Minimum touch target size */
        width: 100%;
    }

    @media (min-width: 768px) {
        .btn {
            width: auto;
            min-height: 36px;
            padding: 0.5rem 1rem;
        }
    }

    .btn-icon {
        padding: 0.75rem;
    }

    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }

    .btn-primary:hover {
        background-color: #2563eb;
    }

    .btn-secondary {
        background-color: #e2e8f0;
        color: #475569;
    }

    .btn-secondary:hover {
        background-color: #cbd5e1;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Global styles */
    :global(.database-table td) {
        padding: 0.75rem 1rem;
    }

    :global(.database-table th) {
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 500;
        color: #475569;
        background-color: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
    }

    :global(.w-4) {
        width: 1.25rem;
    }

    :global(.h-4) {
        height: 1.25rem;
    }

    /* Error message */
    .error-message {
        padding: 1rem;
        background-color: #fee2e2;
        color: #dc2626;
        margin: 1rem;
        border-radius: 0.5rem;
        font-size: 1rem;
    }
</style>
