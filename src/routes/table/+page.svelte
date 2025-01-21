<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import DataTable from '$lib/components/DataTable/DataTable.svelte';
    import type { Column } from '$lib/components/DataTable/types';

    interface Note {
        id: string;
        name: string;
        summary: string;
        status: 'Not Started' | 'In Progress' | 'Done';
        due_date: string | null;
        priority: 'Low' | 'Medium' | 'High';
        category: 'Note' | 'Task' | 'Reminder';
        created_at: string;
        completed_at?: string;
    }

    let notes: Note[] = [];
    let loading = true;
    let error = '';

    const columns: Column[] = [
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
            id: 'name', 
            label: 'Name', 
            width: '200px', 
            sortable: true,
            template: (value, row) => `
                <div class="note-content ${row.status === 'Done' ? 'done' : ''}">
                    ${value || ''}
                </div>
            `
        },
        { 
            id: 'summary', 
            label: 'Summary', 
            width: '300px', 
            sortable: true,
            template: (value, row) => `
                <div class="note-content ${row.status === 'Done' ? 'done' : ''}">
                    ${value || ''}
                </div>
            `
        },
        { 
            id: 'status', 
            label: 'Status', 
            width: '150px',
            sortable: true,
            filterOptions: ['Not Started', 'In Progress', 'Done'],
            template: (value) => {
                const colors = {
                    'Not Started': '#6c757d',
                    'In Progress': '#007bff',
                    'Done': '#28a745'
                };
                return `<span style="color: ${colors[value]}">${value}</span>`;
            }
        },
        { 
            id: 'due_date', 
            label: 'Due Date', 
            width: '150px', 
            sortable: true,
            template: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        { 
            id: 'priority', 
            label: 'Priority', 
            width: '150px',
            sortable: true,
            filterOptions: ['Low', 'Medium', 'High'],
            template: (value) => {
                const colors = {
                    'Low': '#28a745',
                    'Medium': '#ffc107',
                    'High': '#dc3545'
                };
                return `<span style="color: ${colors[value]}">${value}</span>`;
            }
        },
        { 
            id: 'category', 
            label: 'Category', 
            width: '150px',
            sortable: true,
            filterOptions: ['Note', 'Task', 'Reminder']
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
            const { data, error: err } = await supabase
                .from('brain_dump_database')
                .select('*')
                .order('status', { ascending: true })
                .order('created_at', { ascending: false });

            if (err) throw err;

            notes = data || [];
            // Sort with done items at the bottom
            notes.sort((a, b) => {
                if (a.status === 'Done' && b.status !== 'Done') return 1;
                if (a.status !== 'Done' && b.status === 'Done') return -1;
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
            const { error: err } = await supabase
                .from('brain_dump_database')
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
        <button class="new-button" on:click={() => goto('/table/new')}>
            <i class="fas fa-plus"></i>
            New Note
        </button>
    </div>

    <DataTable
        {columns}
        data={notes}
        {loading}
        {error}
        on:sort={handleSort}
        on:filter={handleFilter}
        on:rowAction={handleRowAction}
    />
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

    @media (max-width: 768px) {
        .container {
            padding: 0.5rem;
        }
    }
</style>
