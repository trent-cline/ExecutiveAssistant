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
    let columnWidths: { [key: string]: number } = {};

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

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const { error: deleteError } = await supabase
                .from(config.tableName)
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            
            // Update local data
            data = data.filter(row => row.id !== id);
            applyFiltersAndSort();
            onDataChange(data);
            dispatch('delete', { id });
        } catch (err) {
            console.error('Error deleting record:', err);
            error = err.message;
        }
    }

    async function handleSave(formData: any) {
        try {
            const isEdit = 'id' in formData;
            const { data: savedData, error: saveError } = isEdit
                ? await supabase
                    .from(config.tableName)
                    .update(formData)
                    .eq('id', formData.id)
                    .select()
                : await supabase
                    .from(config.tableName)
                    .insert([formData])
                    .select();

            if (saveError) throw saveError;
            if (!savedData || savedData.length === 0) throw new Error('No data returned from save operation');

            // Update local data
            if (isEdit) {
                data = data.map(row => 
                    row.id === formData.id ? savedData[0] : row
                );
            } else {
                data = [...data, savedData[0]];
            }
            
            applyFiltersAndSort();
            onDataChange(data);
            showEditModal = false;
            dispatch(isEdit ? 'edit' : 'add', { row: savedData[0] });
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

    function handleColumnResize(event: CustomEvent) {
        const { column, width } = event.detail;
        columnWidths[column] = width;
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
                    />
                </div>
            {/if}
            
            <div class="toolbar-actions">
                {#if config.features?.add && config.permissions?.canAdd}
                    <button class="btn btn-primary" on:click={handleAdd}>
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
                            transition:fade|local
                            class:selected={selectedRows.has(row.id)}
                        >
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

                            {#if config.features?.edit || config.features?.delete || config.customActions}
                                <td class="action-cell">
                                    <div class="action-buttons">
                                        {#if config.features?.edit && config.permissions?.canEdit(row)}
                                            <button 
                                                class="action-button edit-button" 
                                                on:click={() => handleEdit(row)}
                                            >
                                                <i class="fas fa-edit"></i>
                                            </button>
                                        {/if}
                                        
                                        {#if config.features?.delete && config.permissions?.canDelete(row)}
                                            <button 
                                                class="action-button delete-button"
                                                on:click={() => handleDelete(row.id)}
                                            >
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        {/if}

                                        {#if config.customActions}
                                            {#each config.customActions as action}
                                                <button
                                                    class="action-button custom-button"
                                                    on:click={() => action.handler(row)}
                                                >
                                                    <i class="fas fa-{action.icon || 'cog'}"></i>
                                                </button>
                                            {/each}
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
                >
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button 
                    class="page-button"
                    disabled={currentPage === 1}
                    on:click={() => currentPage--}
                >
                    <i class="fas fa-angle-left"></i>
                </button>
                <span class="page-info">
                    Page {currentPage} of {totalPages}
                </span>
                <button 
                    class="page-button"
                    disabled={currentPage === totalPages}
                    on:click={() => currentPage++}
                >
                    <i class="fas fa-angle-right"></i>
                </button>
                <button 
                    class="page-button"
                    disabled={currentPage === totalPages}
                    on:click={() => currentPage = totalPages}
                >
                    <i class="fas fa-angle-double-right"></i>
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
        width: 100%;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .table-container {
        overflow: hidden;
        border-radius: 8px;
    }

    .table-wrapper {
        overflow-x: auto;
        position: relative;
        -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.875rem; /* Smaller base font size for mobile */
    }

    .table-fixed {
        table-layout: fixed;
    }

    tr {
        background: white;
        transition: background-color 0.2s;
    }

    tr:hover {
        background-color: #f8fafc;
    }

    td {
        padding: 0.5rem; /* Reduced padding for mobile */
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Mobile-first styles */
    .action-cell {
        width: auto; /* Auto width on mobile */
        text-align: right;
        padding-right: 0.5rem;
    }

    .action-buttons {
        display: flex;
        gap: 0.25rem; /* Reduced gap for mobile */
        justify-content: flex-end;
    }

    .action-button {
        padding: 0.375rem; /* Smaller padding for mobile */
        border-radius: 0.375rem;
        color: #64748b;
        transition: all 0.2s;
        min-width: 32px; /* Ensure touchable size */
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
        gap: 0.25rem; /* Reduced gap for mobile */
        padding: 0.75rem;
        border-top: 1px solid #e2e8f0;
        flex-wrap: wrap; /* Allow wrapping on very small screens */
    }

    .page-button {
        padding: 0.375rem;
        border-radius: 0.375rem;
        color: #64748b;
        transition: all 0.2s;
        min-width: 32px; /* Ensure touchable size */
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .page-info {
        color: #64748b;
        font-size: 0.75rem; /* Smaller font for mobile */
        padding: 0 0.5rem;
    }

    .toolbar-actions {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap; /* Allow wrapping on mobile */
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

    /* Tablet and desktop styles */
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

    /* Optional: Hide less important columns on mobile */
    @media (max-width: 639px) {
        .hide-on-mobile {
            display: none;
        }
    }
</style>
