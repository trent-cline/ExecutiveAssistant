<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column } from '$lib/components/DatabaseTable/types';

    interface Note {
        id: string;
        content?: string;
        name?: string;
        summary?: string;
        status?: 'Not Started' | 'In Progress' | 'Done';
        due_date?: string | null;
        priority?: 'Low' | 'Medium' | 'High';
        category?: 'Note' | 'Task' | 'Reminder';
        created_at: string;
        completed_at?: string;
        source?: 'public' | 'private' | 'brain_dump';
        source_type?: string;
        analyzed: boolean;
    }

    let notes: Note[] = [];
    let loading = true;
    let error = '';
    let hideCompleted = false;
    let displayedNotes: Note[] = [];

    $: {
        // Filter notes based on hideCompleted setting
        displayedNotes = hideCompleted 
            ? notes.filter(note => note.status !== 'Done')
            : notes;
    }

    const columns: Column[] = [
        {
            id: 'status',
            label: 'Status',
            width: '100px'
        },
        {
            id: 'name',
            label: 'Name',
            wrap: true
        },
        {
            id: 'summary',
            label: 'Summary',
            wrap: true
        },
        {
            id: 'category',
            label: 'Category',
            hideMobile: true,
            width: '120px'
        },
        {
            id: 'priority',
            label: 'Priority',
            hideMobile: true,
            width: '100px'
        },
        {
            id: 'source',
            label: 'Source',
            hideMobile: true,
            width: '100px'
        },
        {
            id: 'created_at',
            label: 'Created',
            hideMobile: true,
            width: '150px'
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
        },
        { 
            id: 'content', 
            label: 'Content', 
            width: '300px', 
            sortable: true,
            template: (value, row) => `
                <div class="note-content ${row.status === 'Done' ? 'done' : ''}">
                    ${value || row.name || ''}
                </div>
            `
        },
        { 
            id: 'due_date', 
            label: 'Due Date', 
            width: '150px', 
            sortable: true,
            template: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        { 
            id: 'actions', 
            label: '', 
            width: '100px',
            actions: [
                { icon: 'edit', label: 'Edit', action: 'edit' },
                { icon: 'shopping-cart', label: 'Move to Shopping', action: 'moveToShopping' }
            ]
        }
    ];

    const tableConfig = {
        columns,
        pageSize: 10,
        features: {
            search: true,
            pagination: true,
            sort: true,
            filter: true
        },
        permissions: {
            canEdit: (row) => true,
            canDelete: (row) => true
        }
    };

    onMount(async () => {
        if (!$user) {
            goto('/login');
            return;
        }
        
        // Add event listener for status toggle
        document.addEventListener('toggle-status', handleStatusToggle);
        
        await loadNotes();

        return () => {
            document.removeEventListener('toggle-status', handleStatusToggle);
        };
    });

    async function loadNotes() {
        try {
            loading = true;
            error = '';

            // Load brain dump notes
            const { data: brainDumpData, error: brainDumpError } = await supabase
                .from('brain_dump_database')
                .select('*')
                .order('created_at', { ascending: false });

            if (brainDumpError) throw brainDumpError;

            // Load public notes
            const { data: publicData, error: publicError } = await supabase
                .from('public_notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (publicError) throw publicError;

            // Load private notes
            const { data: privateData, error: privateError } = await supabase
                .from('private_notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (privateError) throw privateError;

            // Transform and combine notes
            const transformedBrainDump = (brainDumpData || []).map(note => ({
                ...note,
                source: 'brain_dump'
            }));

            const transformedPublic = (publicData || []).map(note => ({
                ...note,
                name: note.content,
                source: 'public'
            }));

            const transformedPrivate = (privateData || []).map(note => ({
                ...note,
                name: note.content,
                source: 'private'
            }));

            notes = [...transformedBrainDump, ...transformedPublic, ...transformedPrivate]
                .sort((a, b) => {
                    // First sort by status (Done items at bottom)
                    if (a.status === 'Done' && b.status !== 'Done') return 1;
                    if (a.status !== 'Done' && b.status === 'Done') return -1;
                    // Then by date
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

        } catch (err) {
            console.error('Error loading notes:', err);
            error = 'Failed to load notes';
        } finally {
            loading = false;
        }
    }

    async function handleStatusToggle(event: CustomEvent) {
        const noteId = event.detail;
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const newStatus = note.status === 'Done' ? 'Not Started' : 'Done';
        const updatedNote = {
            ...note,
            status: newStatus
        };

        try {
            // Update the appropriate table based on the note source
            const tableName = note.source === 'brain_dump' ? 'brain_dump_database' :
                            note.source === 'public' ? 'public_notes' :
                            'private_notes';

            const { error: err } = await supabase
                .from(tableName)
                .update({ status: newStatus })
                .eq('id', noteId);

            if (err) throw err;

            // Update local state
            notes = notes.map(n => n.id === noteId ? updatedNote : n)
                .sort((a, b) => {
                    if (a.status === 'Done' && b.status !== 'Done') return 1;
                    if (a.status !== 'Done' && b.status === 'Done') return -1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

        } catch (err) {
            console.error('Error updating note status:', err);
            error = 'Failed to update note status';
        }
    }

    function handleSort(event: CustomEvent) {
        const { column, direction } = event.detail;
        notes = notes.sort((a, b) => {
            if (column === 'status') {
                // Always keep Done items at the bottom
                if (a.status === 'Done' && b.status !== 'Done') return 1;
                if (a.status !== 'Done' && b.status === 'Done') return -1;
                if (a.status === 'Done' && b.status === 'Done') {
                    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                }
            }

            const aVal = a[column];
            const bVal = b[column];
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return direction === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            
            return direction === 'asc' 
                ? (aVal > bVal ? 1 : -1)
                : (bVal > aVal ? 1 : -1);
        });
    }

    function handleFilter(event: CustomEvent) {
        const { column, selectedOptions } = event.detail;
        if (selectedOptions.size === 0) return;
        
        notes = notes.filter(note => 
            selectedOptions.has(note[column])
        );
    }

    function handleRowAction(event: CustomEvent) {
        const { action, rowData } = event.detail;
        if (action === 'edit') {
            goto(`/table/${rowData.id}/edit`);
        } else if (action === 'moveToShopping') {
            moveToShoppingList(rowData);
        }
    }

    async function moveToShoppingList(note: Note) {
        try {
            const { error: insertError } = await supabase
                .from('shopping_list')
                .insert([{
                    name: note.name,
                    description: note.summary,
                    status: 'Not Started',
                    priority: note.priority,
                    user_id: $user?.id
                }]);

            if (insertError) throw insertError;

            const { error: deleteError } = await supabase
                .from('brain_dump_database')
                .delete()
                .eq('id', note.id);

            if (deleteError) throw deleteError;

            await loadNotes();
        } catch (error) {
            console.error('Error moving to shopping list:', error);
            alert('Failed to move item to shopping list');
        }
    }
</script>

<div class="container">
    <div class="header">
        <h1>Brain Inbox Database</h1>
        <div class="header-controls">
            <label class="toggle-label">
                <input 
                    type="checkbox" 
                    bind:checked={hideCompleted}
                >
                Hide Completed Items
            </label>
            <button class="new-button" on:click={() => goto('/table/new')}>
                <i class="fas fa-plus"></i>
                New Note
            </button>
        </div>
    </div>

    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if loading}
        <div class="loading">Loading...</div>
    {:else}
        <DatabaseTable
            config={tableConfig}
            initialData={displayedNotes}
            {supabase}
            on:sort={handleSort}
            on:filter={handleFilter}
            on:rowAction={handleRowAction}
        />
    {/if}
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .header-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #666;
        cursor: pointer;
    }

    .toggle-label input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
    }

    .new-button {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .new-button:hover {
        background: #45a049;
    }

    :global(.note-content) {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    :global(.note-content.done) {
        opacity: 0.6;
        text-decoration: line-through;
    }

    :global(.action-button.done) {
        color: #22c55e;
    }

    .error {
        color: #dc3545;
        padding: 1rem;
        margin: 1rem 0;
        background: #f8d7da;
        border-radius: 4px;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0.5rem;
        }
    }
</style>
