<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column, DatabaseTableConfig } from '$lib/components/DatabaseTable/types';

    interface Note {
        id: string;
        created_at: string;
        name: string;
        due_date?: string;
        status: 'Not Started' | 'In Progress' | 'Done';
        localid: string;
        summary?: string;
        priority: 'Low' | 'Medium' | 'High';
        category: 'Note' | 'Task' | 'Reminder';
        user_id: string;
    }

    export let hideCompleted = false;

    let notes: Note[] = [];
    let loading = true;
    let error = '';
    let displayedNotes: Note[] = [];

    $: {
        displayedNotes = hideCompleted 
            ? notes.filter(note => note.status !== 'Done')
            : notes;
    }

    const columns: Column[] = [
        {
            id: 'status',
            label: 'Status',
            width: '100px',
            sortable: true,
            filterable: true
        },
        {
            id: 'name',
            label: 'Name',
            width: '200px',
            sortable: true,
            type: 'text'
        },
        {
            id: 'summary',
            label: 'Summary',
            width: '400px',
            sortable: true,
            type: 'text'
        },
        {
            id: 'category',
            label: 'Category',
            width: '120px',
            sortable: true,
            filterable: true,
            type: 'select'
        },
        {
            id: 'priority',
            label: 'Priority',
            width: '100px',
            sortable: true,
            filterable: true,
            type: 'select'
        },
        {
            id: 'due_date',
            label: 'Due Date',
            width: '120px',
            sortable: true,
            type: 'date',
            template: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        {
            id: 'created_at',
            label: 'Created',
            width: '150px',
            sortable: true,
            type: 'date',
            template: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        {
            id: 'status_toggle',
            label: '',
            width: '50px',
            template: (_, row) => `
                <button 
                    class="action-button ${row.status === 'Done' ? 'done' : ''}"
                    title="${row.status === 'Done' ? 'Mark as not done' : 'Mark as done'}"
                    onclick="document.dispatchEvent(new CustomEvent('toggle-status', { detail: '${row.id}' }))"
                >
                    <i class="fas fa-check"></i>
                </button>
            `
        }
    ];

    const tableConfig: DatabaseTableConfig = {
        tableName: 'brain_dump_database',
        columns,
        defaultSort: { column: 'created_at', direction: 'desc' },
        pageSize: 10,
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            edit: true,
            delete: true,
            add: true,
            select: false,
            export: false,
            import: false
        },
        permissions: {
            canView: () => true,
            canEdit: () => true,
            canDelete: () => true,
            canAdd: true
        }
    };

    onMount(async () => {
        await loadNotes();
        document.addEventListener('toggle-status', handleToggleStatus);
        return () => {
            document.removeEventListener('toggle-status', handleToggleStatus);
        };
    });

    async function loadNotes() {
        try {
            loading = true;
            error = '';

            const { data: fetchedNotes, error: fetchError } = await supabase
                .from('brain_dump_database')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            notes = fetchedNotes;
        } catch (err) {
            console.error('Error loading notes:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function handleToggleStatus(event: CustomEvent) {
        const noteId = event.detail;
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const newStatus = note.status === 'Done' ? 'Not Started' : 'Done';

        try {
            const { error: updateError } = await supabase
                .from('brain_dump_database')
                .update({ status: newStatus })
                .eq('id', noteId);

            if (updateError) throw updateError;

            notes = notes.map(n => 
                n.id === noteId 
                    ? { ...n, status: newStatus }
                    : n
            );
        } catch (err) {
            console.error('Error updating note status:', err);
            error = err.message;
        }
    }

    function handleSort(event: CustomEvent) {
        const { column, direction } = event.detail;
        notes = [...notes].sort((a, b) => {
            const aVal = a[column] || '';
            const bVal = b[column] || '';
            return direction === 'asc' 
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        });
    }

    function handleFilter(event: CustomEvent) {
        const { column, selectedOptions } = event.detail;
        if (selectedOptions.size === 0) return;
        
        notes = notes.filter(note => 
            selectedOptions.has(note[column]?.toLowerCase() || '')
        );
    }

    function handleRowAction(event: CustomEvent) {
        const { action, row } = event.detail;
        if (action === 'delete') {
            handleDelete(row);
        }
    }

    async function handleDelete(row: Note) {
        try {
            const { error: deleteError } = await supabase
                .from('brain_dump_database')
                .delete()
                .eq('id', row.id);

            if (deleteError) throw deleteError;

            notes = notes.filter(n => n.id !== row.id);
        } catch (err) {
            console.error('Error deleting note:', err);
            error = err.message;
        }
    }
</script>

<div class="brain-inbox-table">
    {#if error}
        <div class="error-message">
            {error}
        </div>
    {/if}

    {#if loading}
        <div class="brain-inbox-container">
            <div class="loading">Loading...</div>
        </div>
    {:else}
        <div class="brain-inbox-container">
            <div class="header">
                <h2>Brain Inbox</h2>
                <p class="subtitle">Central repository for all notes and tasks</p>
            </div>
            <div class="table-container">
                <DatabaseTable
                    config={tableConfig}
                    {supabase}
                    initialData={displayedNotes}
                    onDataChange={(data) => notes = data}
                    className="brain-inbox-table"
                    on:sort={handleSort}
                    on:filter={handleFilter}
                    on:rowAction={handleRowAction}
                />
            </div>
        </div>
    {/if}
</div>

<style>
    .brain-inbox-container {
        background: var(--surface-2, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        padding: 2rem;
        margin: 2rem auto;
        max-width: 1400px;
        width: 95%;
    }

    .header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .header h2 {
        font-size: 1.875rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
        line-height: 1.2;
    }

    .subtitle {
        font-size: 1rem;
        color: var(--text-2, #6b7280);
        margin: 0.5rem 0 0 0;
    }

    .table-container {
        background: var(--surface-1, #ffffff);
        border-radius: 8px;
        overflow: hidden;
    }

    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
        font-size: 1.125rem;
        color: var(--text-2, #6b7280);
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .brain-inbox-container {
            background: var(--surface-2, #1f2937);
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2);
        }

        .header h2 {
            color: var(--text-1, #f3f4f6);
        }

        .subtitle {
            color: var(--text-2, #9ca3af);
        }

        .table-container {
            background: var(--surface-1, #111827);
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .brain-inbox-container {
            padding: 1rem;
            margin: 1rem auto;
            width: 98%;
        }

        .header {
            margin-bottom: 1rem;
        }

        .header h2 {
            font-size: 1.5rem;
        }

        .subtitle {
            font-size: 0.875rem;
        }
    }

    .error-message {
        padding: 1rem;
        margin-bottom: 1rem;
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        border-radius: 0.375rem;
        color: #991b1b;
    }

    .brain-inbox-table {
        width: 100%;
    }

    :global(.brain-inbox-table td) {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :global(.brain-inbox-table td[data-column="summary"]) {
        max-width: 400px;
        white-space: pre-line;
    }
</style>
