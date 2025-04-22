<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';

    let note = {
        name: '',
        summary: '',
        status: 'Not Started',
        due_date: '',
        priority: 'Medium',
        category: 'Note'
    };

    onMount(() => {
        if (!$user) {
            goto('/login');
        }
    });

    async function saveNote() {
        try {
            const noteData = {
                localid: uuidv4(),
                name: note.name,
                summary: note.summary,
                status: note.status,
                priority: note.priority,
                category: note.category,
                user_id: $user?.id,
                created_at: new Date().toISOString()
            };

            // Only add due_date if it's not empty
            if (note.due_date) {
                noteData.due_date = note.due_date;
            }

            const { data, error } = await supabase
                .from('brain_dump')
                .insert([noteData])
                .select();

            if (error) throw error;
            goto('/table');
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note. Please try again.');
        }
    }
</script>

<div class="container">
    <div class="header">
        <h1>New Note</h1>
    </div>

    <form on:submit|preventDefault={saveNote} class="form">
        <div class="form-group">
            <label for="name">Title</label>
            <input
                type="text"
                id="name"
                bind:value={note.name}
                required
                placeholder="Enter note title"
            />
        </div>

        <div class="form-group">
            <label for="summary">Summary</label>
            <textarea
                id="summary"
                bind:value={note.summary}
                rows="4"
                placeholder="Enter note summary (optional)"
            ></textarea>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="status">Status</label>
                <select id="status" bind:value={note.status}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                </select>
            </div>

            <div class="form-group">
                <label for="priority">Priority</label>
                <select id="priority" bind:value={note.priority}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="category">Category</label>
                <select id="category" bind:value={note.category}>
                    <option value="Note">Note</option>
                    <option value="Task">Task</option>
                    <option value="Reminder">Reminder</option>
                </select>
            </div>

            <div class="form-group">
                <label for="due_date">Due Date</label>
                <input
                    type="date"
                    id="due_date"
                    bind:value={note.due_date}
                />
            </div>
        </div>

        <div class="button-group">
            <button type="button" class="secondary" on:click={() => goto('/table')}>
                Cancel
            </button>
            <button type="submit" class="primary">
                Save Note
            </button>
        </div>
    </form>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .header {
        margin-bottom: 2rem;
    }

    .form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .form-group {
        margin-bottom: 1.5rem;
        width: 100%;
    }

    .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        color: #333;
    }

    textarea {
        resize: vertical;
        min-height: 100px;
    }

    select {
        background-color: white;
    }

    .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .primary {
        background-color: #0066cc;
        color: white;
    }

    .primary:hover {
        background-color: #0052a3;
    }

    .secondary {
        background-color: #f5f5f5;
        color: #333;
    }

    .secondary:hover {
        background-color: #e5e5e5;
    }

    @media (max-width: 640px) {
        .form-row {
            flex-direction: column;
            gap: 1.5rem;
        }

        .form {
            padding: 1rem;
        }
    }
</style>
