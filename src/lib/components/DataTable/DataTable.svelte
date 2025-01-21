<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import TableHeader from './TableHeader.svelte';
    import TableRow from './TableRow.svelte';
    import type { Column } from './types';

    export let columns: Column[] = [];
    export let data: any[] = [];
    export let loading = false;
    export let error = '';
    export let pageSize = 10;
    export let searchable = true;
    export let selectable = false;
    export let emptyMessage = 'No data available';
    export let loadingMessage = 'Loading data...';

    const dispatch = createEventDispatcher();

    let searchTerm = '';
    let currentPage = 1;
    let selectedRows = new Set();
    let sortConfig = { column: null, direction: 'asc' };
    let activeFilterColumn = null;
    let filteredData: any[] = [];
    let visibleColumns = new Set(columns.map(col => col.id));

    $: {
        // Filter data based on search term
        filteredData = data.filter(row => {
            if (!searchTerm) return true;
            return columns.some(col => {
                const value = row[col.id];
                return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });

        // Sort data
        if (sortConfig.column) {
            filteredData = [...filteredData].sort((a, b) => {
                const aVal = a[sortConfig.column];
                const bVal = b[sortConfig.column];
                const direction = sortConfig.direction === 'asc' ? 1 : -1;
                
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return (aVal - bVal) * direction;
                }
                return String(aVal).localeCompare(String(bVal)) * direction;
            });
        }
    }

    $: totalPages = Math.ceil(filteredData.length / pageSize);
    $: paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    function handleSort(column: string) {
        if (sortConfig.column === column) {
            sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortConfig.column = column;
            sortConfig.direction = 'asc';
        }
        dispatch('sort', { column, direction: sortConfig.direction });
    }

    function handleFilter(column: string, event: CustomEvent) {
        activeFilterColumn = column;
        dispatch('filter', event.detail);
    }

    function handleRowSelect(row: any) {
        if (selectedRows.has(row.id)) {
            selectedRows.delete(row.id);
        } else {
            selectedRows.add(row.id);
        }
        selectedRows = selectedRows; // Trigger reactivity
        dispatch('select', { selectedRows: Array.from(selectedRows) });
    }

    function handleSelectAll() {
        if (selectedRows.size === paginatedData.length) {
            selectedRows.clear();
        } else {
            paginatedData.forEach(row => selectedRows.add(row.id));
        }
        selectedRows = selectedRows; // Trigger reactivity
        dispatch('select', { selectedRows: Array.from(selectedRows) });
    }

    function toggleColumn(columnId: string) {
        if (visibleColumns.has(columnId)) {
            visibleColumns.delete(columnId);
        } else {
            visibleColumns.add(columnId);
        }
        visibleColumns = new Set(visibleColumns); // Trigger reactivity
    }

    function nextPage() {
        if (currentPage < totalPages) currentPage++;
    }

    function prevPage() {
        if (currentPage > 1) currentPage--;
    }

    function goToPage(page: number) {
        currentPage = Math.max(1, Math.min(page, totalPages));
    }
</script>

<div class="datatable-container">
    {#if searchable}
        <div class="search-box">
            <i class="fas fa-search"></i>
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Search..."
                transition:slide
            />
        </div>
    {/if}

    <div class="column-selector">
        <button class="btn-icon" on:click={() => document.getElementById('columnMenu').classList.toggle('show')}>
            <i class="fas fa-columns"></i>
        </button>
        <div class="column-menu" id="columnMenu">
            {#each columns as column}
                <label class="column-option">
                    <input
                        type="checkbox"
                        checked={visibleColumns.has(column.id)}
                        on:change={() => toggleColumn(column.id)}
                    />
                    {column.label}
                </label>
            {/each}
        </div>
    </div>

    {#if loading}
        <div class="loading-message" transition:fade>
            <i class="fas fa-spinner fa-spin"></i>
            {loadingMessage}
        </div>
    {:else if error}
        <div class="error-message" transition:fade>
            <i class="fas fa-exclamation-circle"></i>
            {error}
        </div>
    {:else if paginatedData.length === 0}
        <div class="empty-message" transition:fade>
            <i class="fas fa-inbox"></i>
            {emptyMessage}
        </div>
    {:else}
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        {#each columns.filter(col => visibleColumns.has(col.id)) as column (column.id)}
                            <TableHeader 
                                {column}
                                sortActive={sortConfig.column === column.id}
                                sortDirection={sortConfig.direction}
                                on:sort={() => handleSort(column.id)}
                            />
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each paginatedData as row, i (row.id || `row-${i}`)}
                        <TableRow 
                            {row}
                            columns={columns.filter(col => visibleColumns.has(col.id))}
                            selected={selectedRows.has(row.id)}
                            on:select={() => handleRowSelect(row)}
                        />
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    {#if totalPages > 1}
        <div class="pagination" transition:slide={{ duration: 200, easing: quintOut }}>
            <button class="btn-icon" disabled={currentPage === 1} on:click={prevPage}>
                <i class="fas fa-chevron-left"></i>
            </button>
            
            {#if totalPages <= 7}
                {#each Array(totalPages) as _, i}
                    <button
                        class="btn-page"
                        class:active={currentPage === i + 1}
                        on:click={() => goToPage(i + 1)}
                    >
                        {i + 1}
                    </button>
                {/each}
            {:else}
                {#each [1, Math.max(currentPage - 1, 2), currentPage, Math.min(currentPage + 1, totalPages - 1), totalPages] as page}
                    {#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
                        <button
                            class="btn-page"
                            class:active={currentPage === page}
                            on:click={() => goToPage(page)}
                        >
                            {page}
                        </button>
                    {:else if page === Math.max(currentPage - 1, 2) || page === Math.min(currentPage + 1, totalPages - 1)}
                        <span class="pagination-ellipsis">...</span>
                    {/if}
                {/each}
            {/if}

            <button class="btn-icon" disabled={currentPage === totalPages} on:click={nextPage}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    {/if}
</div>

<style>
    .datatable-container {
        width: 100%;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .table-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .search-box {
        position: relative;
        flex: 1;
        max-width: 300px;
    }

    .search-box i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #6c757d;
    }

    .search-box input {
        width: 100%;
        padding: 0.5rem 0.75rem 0.5rem 2.25rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .column-selector {
        position: relative;
        margin-left: 1rem;
    }

    .column-menu {
        display: none;
        position: absolute;
        right: 0;
        top: 100%;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }

    .column-menu.show {
        display: block;
    }

    .column-option {
        display: flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        user-select: none;
    }

    .column-option:hover {
        background: #f8f9fa;
    }

    .table-wrapper {
        overflow-x: auto;
        position: relative;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .loading-message, .empty-message {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    .loading-spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 2px solid #dee2e6;
        border-top-color: #0d6efd;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
    }

    .select-column {
        width: 40px;
        text-align: center;
    }

    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        gap: 0.25rem;
    }

    .btn-icon {
        padding: 0.5rem;
        border: none;
        background: transparent;
        color: #6c757d;
        cursor: pointer;
        border-radius: 4px;
    }

    .btn-icon:hover:not(:disabled) {
        background: #f8f9fa;
        color: #0d6efd;
    }

    .btn-icon:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-page {
        padding: 0.5rem 0.75rem;
        border: none;
        background: transparent;
        color: #6c757d;
        cursor: pointer;
        border-radius: 4px;
    }

    .btn-page:hover:not(.active) {
        background: #f8f9fa;
        color: #0d6efd;
    }

    .btn-page.active {
        background: #0d6efd;
        color: white;
    }

    .pagination-ellipsis {
        padding: 0.5rem;
        color: #6c757d;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: #f8d7da;
        color: #842029;
        border-radius: 4px;
        margin: 1rem;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        .table-controls {
            flex-direction: column;
            gap: 1rem;
        }

        .search-box {
            max-width: 100%;
        }

        .column-selector {
            margin-left: 0;
        }

        .pagination {
            flex-wrap: wrap;
        }
    }
</style>
