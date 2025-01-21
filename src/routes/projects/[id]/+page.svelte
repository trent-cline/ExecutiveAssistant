<script lang="ts">
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';

    interface Project {
        id: string;
        company_name: string;
        partner_name: string;
        industry: string;
        ownership: number;
        development_revenue: string;
        additional_revenue: string;
        exclusivity: string;
        status: string;
        website: string;
        milestones: Milestone[];
        notes: Note[];
    }

    interface Milestone {
        id: string;
        project_id: string;
        title: string;
        description: string;
        due_date: string;
        status: string;
        priority: string;
        created_at: string;
        updated_at: string;
    }

    interface Note {
        id: string;
        project_id: string;
        content: string;
        created_at: string;
        updated_at: string;
    }

    let project: Project | null = null;
    let loading = true;
    let error = '';
    let editMode = false;
    let newMilestone = {
        title: '',
        description: '',
        due_date: '',
        status: 'Not Started',
        priority: 'Medium'
    };
    let newNote = '';

    onMount(async () => {
        if (!$user) {
            goto('/login');
            return;
        }
        await loadProject();
    });

    async function loadProject() {
        try {
            // First load the project
            const { data: projectData, error: projectError } = await supabase
                .from('active_projects')
                .select('*')
                .eq('id', $page.params.id)
                .single();

            if (projectError) throw projectError;

            // Then load milestones
            const { data: milestonesData, error: milestonesError } = await supabase
                .from('milestones')
                .select('*')
                .eq('project_id', $page.params.id)
                .order('due_date', { ascending: true });

            if (milestonesError) throw milestonesError;

            // Then load notes
            const { data: notesData, error: notesError } = await supabase
                .from('notes')
                .select('*')
                .eq('project_id', $page.params.id)
                .order('created_at', { ascending: false });

            if (notesError) throw notesError;

            // Combine all data
            project = {
                ...projectData,
                milestones: milestonesData || [],
                notes: notesData || []
            };
        } catch (err) {
            console.error('Error loading project:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function updateProject() {
        if (!project) return;
        
        try {
            const { error: err } = await supabase
                .from('active_projects')
                .update({
                    company_name: project.company_name,
                    partner_name: project.partner_name,
                    industry: project.industry,
                    ownership: project.ownership,
                    development_revenue: project.development_revenue,
                    additional_revenue: project.additional_revenue,
                    exclusivity: project.exclusivity,
                    status: project.status,
                    website: project.website
                })
                .eq('id', project.id);

            if (err) throw err;
            editMode = false;
        } catch (err) {
            console.error('Error updating project:', err);
            error = err.message;
        }
    }

    async function addMilestone() {
        if (!project) return;

        try {
            const { data, error: err } = await supabase
                .from('milestones')
                .insert([{
                    project_id: project.id,
                    title: newMilestone.title,
                    description: newMilestone.description,
                    due_date: newMilestone.due_date,
                    status: newMilestone.status,
                    priority: newMilestone.priority
                }])
                .select()
                .single();

            if (err) throw err;

            project.milestones = [...project.milestones, data];
            newMilestone = {
                title: '',
                description: '',
                due_date: '',
                status: 'Not Started',
                priority: 'Medium'
            };
        } catch (err) {
            console.error('Error adding milestone:', err);
            error = err.message;
        }
    }

    async function addNote() {
        if (!project || !newNote.trim()) return;

        try {
            const { data, error: err } = await supabase
                .from('notes')
                .insert([{
                    project_id: project.id,
                    content: newNote.trim()
                }])
                .select()
                .single();

            if (err) throw err;

            project.notes = [data, ...project.notes];
            newNote = '';
        } catch (err) {
            console.error('Error adding note:', err);
            error = err.message;
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString();
    }
</script>

<div class="project-page">
    {#if loading}
        <div class="loading">Loading project details...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else if project}
        <div class="header">
            <div class="title-section">
                <h1>{project.company_name}</h1>
                {#if project.website}
                    <a href={project.website} target="_blank" rel="noopener noreferrer" class="website-link">
                        <i class="fas fa-external-link-alt"></i>
                        Visit Website
                    </a>
                {/if}
            </div>
            <button class="edit-button" on:click={() => editMode = !editMode}>
                <i class="fas fa-{editMode ? 'save' : 'edit'}"></i>
                {editMode ? 'Save Changes' : 'Edit Project'}
            </button>
        </div>

        <div class="project-grid">
            <div class="project-info">
                <h2>Project Details</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Company</label>
                        {#if editMode}
                            <input bind:value={project.company_name} />
                        {:else}
                            <span>{project.company_name}</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Partner</label>
                        {#if editMode}
                            <input bind:value={project.partner_name} />
                        {:else}
                            <span>{project.partner_name}</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Industry</label>
                        {#if editMode}
                            <input bind:value={project.industry} />
                        {:else}
                            <span>{project.industry}</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Ownership %</label>
                        {#if editMode}
                            <input type="number" bind:value={project.ownership} />
                        {:else}
                            <span>{project.ownership}%</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Development Revenue</label>
                        {#if editMode}
                            <input bind:value={project.development_revenue} />
                        {:else}
                            <span>{project.development_revenue}</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Additional Revenue</label>
                        {#if editMode}
                            <input bind:value={project.additional_revenue} />
                        {:else}
                            <span>{project.additional_revenue}</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Exclusivity</label>
                        {#if editMode}
                            <input bind:value={project.exclusivity} />
                        {:else}
                            <span>{project.exclusivity}</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Status</label>
                        {#if editMode}
                            <select bind:value={project.status}>
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                        {:else}
                            <span class="status-{project.status.toLowerCase()}">{project.status}</span>
                        {/if}
                    </div>
                    <div class="info-item">
                        <label>Website</label>
                        {#if editMode}
                            <input bind:value={project.website} placeholder="Enter website URL" />
                        {:else}
                            {#if project.website}
                                <a href={project.website} target="_blank" rel="noopener noreferrer" class="website-link">
                                    <i class="fas fa-external-link-alt"></i> Visit Website
                                </a>
                            {:else}
                                <span>No website</span>
                            {/if}
                        {/if}
                    </div>
                </div>
                <div class="actions">
                    {#if editMode}
                        <button class="save" on:click={updateProject}>
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button class="cancel" on:click={() => editMode = false}>
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    {:else}
                        <button class="edit" on:click={() => editMode = true}>
                            <i class="fas fa-edit"></i> Edit Project
                        </button>
                    {/if}
                </div>
            </div>

            <div class="milestones">
                <h2>Milestones</h2>
                <div class="milestone-list">
                    {#each project.milestones as milestone}
                        <div class="milestone-card">
                            <div class="milestone-header">
                                <h3>{milestone.title}</h3>
                                <span class="priority {milestone.priority.toLowerCase()}">{milestone.priority}</span>
                            </div>
                            <p>{milestone.description}</p>
                            <div class="milestone-footer">
                                <span class="status {milestone.status.toLowerCase()}">{milestone.status}</span>
                                <span class="due-date">Due: {formatDate(milestone.due_date)}</span>
                            </div>
                        </div>
                    {/each}
                    
                    <div class="add-milestone">
                        <h3>Add New Milestone</h3>
                        <input 
                            placeholder="Title"
                            bind:value={newMilestone.title}
                        />
                        <textarea 
                            placeholder="Description"
                            bind:value={newMilestone.description}
                        ></textarea>
                        <input 
                            type="date"
                            bind:value={newMilestone.due_date}
                        />
                        <select bind:value={newMilestone.priority}>
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority</option>
                        </select>
                        <select bind:value={newMilestone.status}>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                        <button on:click={addMilestone}>Add Milestone</button>
                    </div>
                </div>
            </div>

            <div class="notes">
                <h2>Notes</h2>
                <div class="notes-list">
                    {#each project.notes as note}
                        <div class="note-card">
                            <p>{note.content}</p>
                            <span class="timestamp">Added: {formatDate(note.created_at)}</span>
                        </div>
                    {/each}
                    
                    <div class="add-note">
                        <textarea 
                            placeholder="Add a new note..."
                            bind:value={newNote}
                        ></textarea>
                        <button on:click={addNote}>Add Note</button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .project-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .title-section {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .website-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border-radius: 4px;
        text-decoration: none;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .website-link:hover {
        background: #0056b3;
    }

    .project-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .info-item label {
        font-weight: 500;
        color: #6c757d;
    }

    .info-item input,
    .info-item select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .actions button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .edit {
        background: #007bff;
        color: white;
    }

    .edit:hover {
        background: #0056b3;
    }

    .save {
        background: #28a745;
        color: white;
    }

    .save:hover {
        background: #218838;
    }

    .cancel {
        background: #6c757d;
        color: white;
    }

    .cancel:hover {
        background: #5a6268;
    }

    .milestone-list, .notes-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .milestone-card, .note-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .milestone-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        font-size: 0.875rem;
    }

    .priority, .status {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .priority.high {
        background: #fce4ec;
        color: #c2185b;
    }

    .priority.medium {
        background: #fff3e0;
        color: #e65100;
    }

    .priority.low {
        background: #e8f5e9;
        color: #2e7d32;
    }

    .status.completed {
        background: #e8f5e9;
        color: #2e7d32;
    }

    .status.active {
        background: #e3f2fd;
        color: #1976d2;
    }

    .status.not.started {
        background: #f5f5f5;
        color: #616161;
    }

    .status.in.progress {
        background: #fff3e0;
        color: #e65100;
    }

    .add-milestone, .add-note {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
    }

    textarea {
        min-height: 100px;
        resize: vertical;
    }

    button {
        background: #0d6efd;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    button:hover {
        background: #0b5ed7;
    }

    .edit-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    @media (max-width: 768px) {
        .project-page {
            padding: 1rem;
        }

        .project-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
