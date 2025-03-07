<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column, DatabaseTableConfig } from '$lib/components/DatabaseTable/types';
    import EditNoteModal from './EditNoteModal.svelte';

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
        completed_at?: string;
        updated_at?: string;
    }

    let notes: Note[] = [];
    let loading = true;
    let error = '';
    let showEditModal = false;
    let editingNote: Note | null = null;

    const columns: Column[] = [
        {
            id: 'status_toggle',
            label: '',
            width: '50px',
            template: (_, row) => `
                <button 
                    class="action-button"
                    title="Mark as done"
                    aria-label="Mark task as done"
                    data-action="toggle-status"
                    data-id="${row.id}"
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
            id: 'actions',
            label: 'Actions',
            width: '280px',
            template: (_, row) => `
                <div class="action-buttons" role="group" aria-label="Note actions">
                    <button 
                        class="action-button edit"
                        title="Edit"
                        aria-label="Edit note"
                        data-action="edit-note"
                        data-id="${row.id}"
                    >
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button 
                        class="action-button delete"
                        title="Delete"
                        aria-label="Delete note"
                        data-action="delete-note"
                        data-id="${row.id}"
                    >
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                    <button 
                        class="action-button shopping"
                        title="Send to Shopping List"
                        aria-label="Send to Shopping List"
                        data-action="send-to-shopping"
                        data-id="${row.id}"
                    >
                        <i class="fas fa-shopping-cart" aria-hidden="true"></i>
                    </button>
                    <button 
                        class="action-button dlltw"
                        title="Send to DLLTW Notes"
                        aria-label="Send to DLLTW Notes"
                        data-action="send-to-dlltw"
                        data-id="${row.id}"
                    >
                        <i class="fas fa-book" aria-hidden="true"></i>
                    </button>
                    <button 
                        class="action-button lists"
                        title="Send to Lists"
                        aria-label="Send to Lists"
                        data-action="send-to-lists"
                        data-id="${row.id}"
                    >
                        <i class="fas fa-list" aria-hidden="true"></i>
                    </button>
                </div>
            `
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
            width: '120px',
            sortable: true,
            type: 'date',
            template: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        {
            id: 'priority',
            label: 'Priority',
            width: '100px',
            sortable: true,
            filterable: true,
            type: 'select'
        }
    ];

    const tableConfig: DatabaseTableConfig = {
        tableName: 'brain_dump',
        columns,
        defaultSort: { column: 'created_at', direction: 'desc' },
        pageSize: 10,
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            edit: false,
            delete: false,
            add: false,
            select: false,
            export: false,
            import: false
        },
        permissions: {
            canView: () => true,
            canEdit: () => true,
            canDelete: () => true,
            canAdd: () => true
        }
    };

    onMount(() => {
        loadNotes();
        
        // Add click event listener to handle all button clicks
        document.querySelector('.brain-inbox-table')?.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const button = target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;
            if (!action || !id) return;

            switch (action) {
                case 'toggle-status':
                    handleToggleStatus(id);
                    break;
                case 'edit-note':
                    handleEdit(id);
                    break;
                case 'delete-note':
                    handleDelete(id);
                    break;
                case 'send-to-dlltw':
                    handleSendToDLLTW(id);
                    break;
                case 'send-to-shopping':
                    handleSendToShopping(id);
                    break;
                case 'send-to-lists':
                    handleSendToLists(id);
                    break;
            }
        });
    });

    async function loadNotes() {
        loading = true;
        error = '';
        try {
            const { data: notesData, error: fetchError } = await supabase
                .from('brain_dump')
                .select('*')
                .not('status', 'eq', 'Done')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            notes = notesData || [];
        } catch (err) {
            console.error('Error fetching notes:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function handleToggleStatus(noteId: string) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        try {
            const { error: updateError } = await supabase
                .from('brain_dump')
                .update({ 
                    status: 'Done',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', noteId);

            if (updateError) throw updateError;
            
            // Update local state
            notes = notes.filter(note => note.id !== noteId);
        } catch (err) {
            console.error('Error updating note status:', err);
            error = err.message;
        }
    }

    async function handleEdit(noteId: string) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        editingNote = note;
        showEditModal = true;
    }

    async function handleEditSave(updatedNote: Note) {
        try {
            const { error: updateError } = await supabase
                .from('brain_dump')
                .update({ 
                    name: updatedNote.name,
                    summary: updatedNote.summary,
                    status: updatedNote.status,
                    priority: updatedNote.priority,
                    category: updatedNote.category,
                    due_date: updatedNote.due_date,
                    updated_at: new Date().toISOString()
                })
                .eq('id', updatedNote.id);

            if (updateError) throw updateError;
            
            showEditModal = false;
            editingNote = null;
            await loadNotes();
        } catch (err) {
            console.error('Error updating note:', err);
            error = err.message;
        }
    }

    async function handleSendToDLLTW(noteId: string) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        try {
            // Insert into dlltw_notes table
            const { error: insertError } = await supabase
                .from('dlltw_notes')
                .insert({
                    name: note.name,
                    summary: note.summary,
                    content: note.summary,
                    status: 'Not Started',
                    priority: note.priority,
                    category: note.category,
                    original_note_id: note.id,
                    user_id: note.user_id
                });

            if (insertError) throw insertError;

            // Update the original note status to Done
            const { error: updateError } = await supabase
                .from('brain_dump')
                .update({
                    status: 'Done',
                    completed_at: new Date().toISOString()
                })
                .eq('id', noteId);

            if (updateError) throw updateError;
            await loadNotes();
        } catch (err) {
            console.error('Error sending to DLLTW:', err);
            error = err.message;
        }
    }

    async function handleSendToShopping(noteId: string) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        try {
            const { error: insertError } = await supabase
                .from('shopping_list')
                .insert({
                    name: note.name,
                    description: note.summary,
                    status: 'Not Started',
                    priority: note.priority,
                    original_note_id: note.id,
                    user_id: note.user_id
                });

            if (insertError) throw insertError;

            // Update the original note status to Done
            const { error: updateError } = await supabase
                .from('brain_dump')
                .update({
                    status: 'Done',
                    completed_at: new Date().toISOString()
                })
                .eq('id', noteId);

            if (updateError) throw updateError;
            await loadNotes();
        } catch (err) {
            console.error('Error sending to shopping list:', err);
            error = err.message;
        }
    }

    async function handleSendToLists(noteId: string) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        try {
            const { data, error } = await supabase
                .from('lists')
                .insert([{
                    name: note.name,
                    description: note.summary,
                    category: 'other',
                    status: 'active',
                    priority: note.priority?.toLowerCase() || 'medium'
                }]);

            if (error) throw error;

            // Show success message or handle UI update
        } catch (err) {
            console.error('Error sending to lists:', err);
            error = err.message;
        }
    }

    async function handleDelete(noteId: string) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            // First delete any related shopping list items
            const { error: shoppingError } = await supabase
                .from('shopping_list')
                .delete()
                .eq('original_note_id', noteId);

            if (shoppingError) throw shoppingError;

            // Delete any related DLLTW notes
            const { error: dlltError } = await supabase
                .from('dlltw_notes')
                .delete()
                .eq('original_note_id', noteId);

            if (dlltError) throw dlltError;

            // Then delete the note itself
            const { error } = await supabase
                .from('brain_dump')
                .delete()
                .eq('id', noteId);

            if (error) throw error;
            await loadNotes();
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

    <div class="database-container">
        <DatabaseTable
            config={tableConfig}
            {supabase}
            initialData={notes}
        />
    </div>

    {#if showEditModal && editingNote}
        <EditNoteModal
            note={editingNote}
            show={showEditModal}
            onClose={() => {
                showEditModal = false;
                editingNote = null;
            }}
            onSave={handleEditSave}
        />
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

    .action-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-start;
    }

    .action-button {
        padding: 0.25rem;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 0.25rem;
        transition: background-color 0.2s;
    }

    .action-button:hover {
        background-color: #f3f4f6;
    }

    .action-button.edit {
        color: #4f46e5;
    }

    .action-button.delete {
        color: #ef4444;
    }

    .action-button.shopping {
        color: #10b981;
    }

    .action-button.dlltw {
        color: #6366f1;
    }

    .action-button.done {
        color: #22c55e;  
        background-color: #dcfce7;
    }

    .action-button.done:hover {
        background-color: #bbf7d0;
    }

    .action-button.not-done {
        color: #6b7280;  
        background-color: #f3f4f6;
    }

    .action-button.not-done:hover {
        background-color: #e5e7eb;
    }

    @media (prefers-color-scheme: dark) {
        .action-button.done {
            color: #4ade80;
            background-color: rgba(34, 197, 94, 0.2);
        }

        .action-button.done:hover {
            background-color: rgba(34, 197, 94, 0.3);
        }

        .action-button.not-done {
            color: #9ca3af;
            background-color: rgba(107, 114, 128, 0.2);
        }

        .action-button.not-done:hover {
            background-color: rgba(107, 114, 128, 0.3);
        }
    }

    .database-container {
        background: var(--surface-2, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        padding: 1.5rem;
        margin: 1rem 0;
    }

    .container-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        cursor: pointer;
    }

    @media (prefers-color-scheme: dark) {
        .database-container {
            background: var(--surface-2, #1f2937);
        }

        .toggle-label {
            color: var(--text-2, #9ca3af);
        }
    }

    @media (max-width: 768px) {
        .database-container {
            padding: 1rem;
            margin: 0.5rem 0;
        }

        .container-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
        }
    }
</style>
