<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';

    interface Note {
        id: string;
        created_at: string;
        name: string;
        summary?: string;
        category: 'Note' | 'Task' | 'Reminder';
        priority: 'Low' | 'Medium' | 'High';
        status: 'Not Started' | 'In Progress' | 'Done';
        due_date?: string;
    }

    let notes: Note[] = [];
    let loading = true;
    let error = '';

    onMount(loadNotes);

    async function loadNotes() {
        try {
            const { data, error: fetchError } = await supabase
                .from('brain_dump')
                .select('*')
                .not('status', 'eq', 'Done')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            notes = data || [];
        } catch (err) {
            console.error('Error fetching notes:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this note?')) return;
        
        try {
            const { error: deleteError } = await supabase
                .from('brain_dump')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await loadNotes();
        } catch (err) {
            console.error('Error deleting note:', err);
            error = err.message;
        }
    }

    async function handleMarkDone(id: string) {
        try {
            const { error: updateError } = await supabase
                .from('brain_dump')
                .update({ 
                    status: 'Done',
                    completed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) throw updateError;
            await loadNotes();
        } catch (err) {
            console.error('Error updating note:', err);
            error = err.message;
        }
    }

    function formatDate(dateStr: string | undefined) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString();
    }
</script>

<div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Brain Inbox</h1>
        <a href="/table" class="text-blue-600 hover:text-blue-800">
            View Advanced Table
        </a>
    </div>

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
        </div>
    {/if}

    {#if loading}
        <div class="text-center py-4">Loading...</div>
    {:else}
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-300">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="px-4 py-2 text-left border-b">Name</th>
                        <th class="px-4 py-2 text-left border-b">Summary</th>
                        <th class="px-4 py-2 text-left border-b">Category</th>
                        <th class="px-4 py-2 text-left border-b">Priority</th>
                        <th class="px-4 py-2 text-left border-b">Due Date</th>
                        <th class="px-4 py-2 text-left border-b">Created</th>
                        <th class="px-4 py-2 text-left border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each notes as note}
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-2 border-b">{note.name}</td>
                            <td class="px-4 py-2 border-b">{note.summary || ''}</td>
                            <td class="px-4 py-2 border-b">{note.category}</td>
                            <td class="px-4 py-2 border-b">
                                <span class="px-2 py-1 rounded text-sm" class:bg-red-100={note.priority === 'High'} class:bg-yellow-100={note.priority === 'Medium'} class:bg-green-100={note.priority === 'Low'}>
                                    {note.priority}
                                </span>
                            </td>
                            <td class="px-4 py-2 border-b">{formatDate(note.due_date)}</td>
                            <td class="px-4 py-2 border-b">{formatDate(note.created_at)}</td>
                            <td class="px-4 py-2 border-b">
                                <div class="flex gap-2">
                                    <button 
                                        class="text-green-600 hover:text-green-800"
                                        on:click={() => handleMarkDone(note.id)}
                                        title="Mark as done"
                                    >
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button 
                                        class="text-red-600 hover:text-red-800"
                                        on:click={() => handleDelete(note.id)}
                                        title="Delete"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 1400px;
    }
    
    th {
        font-weight: 600;
        font-size: 0.875rem;
    }
    
    td {
        font-size: 0.875rem;
    }
    
    button {
        padding: 0.25rem;
    }
    
    .overflow-x-auto {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
</style>
