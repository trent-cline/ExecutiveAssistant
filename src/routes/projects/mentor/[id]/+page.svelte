<script lang="ts">
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { fade, fly } from 'svelte/transition';

    interface MentorProject {
        id: string;
        company_name: string;
        partner_name: string;
        industry: string;
        status: string;
        website: string;
        sample_website: string;
        notes: Note[];
        milestones: Milestone[];
        created_at: string;
        updated_at: string;
    }

    interface Note {
        id: string;
        project_id: string;
        content: string;
        created_at: string;
    }

    interface Milestone {
        id: string;
        project_id: string;
        title: string;
        description: string;
        status: string;
        due_date: string;
    }

    let project: MentorProject | null = null;
    let loading = true;
    let error = '';
    let editMode = false;
    let newNote = '';
    let newMilestone = {
        title: '',
        description: '',
        status: 'Not Started',
        due_date: ''
    };

    onMount(async () => {
        if (!$user) {
            goto('/login');
            return;
        }
        await loadProject();
    });

    async function loadProject() {
        try {
            const { data: projectData, error: projectError } = await supabase
                .from('mentor_to_launch_projects')
                .select(`
                    *,
                    milestones (
                        id,
                        title,
                        description,
                        status,
                        due_date
                    )
                `)
                .eq('id', $page.params.id)
                .single();

            if (projectError) throw projectError;

            // Get project notes through junction table
            const { data: notesData, error: notesError } = await supabase
                .from('project_notes')
                .select(`
                    notes (
                        id,
                        content,
                        created_at
                    )
                `)
                .eq('project_id', $page.params.id);

            if (notesError) throw notesError;

            project = {
                ...projectData,
                notes: notesData?.map(n => n.notes) || []
            };
            loading = false;
        } catch (err) {
            console.error('Error loading project:', err);
            error = err.message;
            loading = false;
        }
    }

    async function updateProject() {
        if (!project) return;

        try {
            const { error: err } = await supabase
                .from('mentor_to_launch_projects')
                .update({
                    company_name: project.company_name,
                    partner_name: project.partner_name,
                    industry: project.industry,
                    status: project.status,
                    website: project.website,
                    sample_website: project.sample_website
                })
                .eq('id', project.id);

            if (err) throw err;
            editMode = false;
        } catch (err) {
            console.error('Error updating project:', err);
            error = err.message;
        }
    }

    async function addNote() {
        if (!project || !newNote.trim()) return;

        try {
            // First insert the note
            const { data: noteData, error: noteError } = await supabase
                .from('notes')
                .insert([{
                    content: newNote.trim(),
                    user_id: $user?.id
                }])
                .select()
                .single();

            if (noteError) throw noteError;

            // Then create the relationship in project_notes
            const { error: relationError } = await supabase
                .from('project_notes')
                .insert([{
                    project_id: project.id,
                    note_id: noteData.id
                }]);

            if (relationError) throw relationError;

            project.notes = [noteData, ...project.notes];
            newNote = '';
        } catch (err) {
            console.error('Error adding note:', err);
            error = err.message;
        }
    }

    async function addMilestone() {
        if (!project || !newMilestone.title) return;

        try {
            const { data, error: err } = await supabase
                .from('milestones')
                .insert([{
                    project_id: project.id,
                    ...newMilestone
                }])
                .select()
                .single();

            if (err) throw err;

            project.milestones = [...project.milestones, data];
            newMilestone = {
                title: '',
                description: '',
                status: 'Not Started',
                due_date: ''
            };
        } catch (err) {
            console.error('Error adding milestone:', err);
            error = err.message;
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString();
    }
</script>

<div class="project-page" in:fade>
    <div class="header" in:fly="{{ y: -20, duration: 300 }}">
        <a href="/projects" class="back-link">
            <i class="fas fa-arrow-left"></i>
            Back to Projects
        </a>
        {#if project}
            <h1>{project.company_name}</h1>
        {/if}
    </div>

    {#if loading}
        <div class="loading">Loading project details...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else if project}
        <div class="project-content" in:fly="{{ y: 20, duration: 300, delay: 200 }}">
            <!-- Project Info Section -->
            <section class="info-section">
                <div class="section-header">
                    <h2>Project Details</h2>
                    {#if editMode}
                        <div class="actions">
                            <button class="save-btn" on:click={updateProject}>
                                <i class="fas fa-save"></i> Save
                            </button>
                            <button class="cancel-btn" on:click={() => editMode = false}>
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    {:else}
                        <button class="edit-btn" on:click={() => editMode = true}>
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    {/if}
                </div>

                <div class="info-grid">
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
                        <label>Status</label>
                        {#if editMode}
                            <select bind:value={project.status}>
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                        {:else}
                            <span class="status-badge {project.status.toLowerCase()}">{project.status}</span>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Website</label>
                        {#if editMode}
                            <input bind:value={project.website} placeholder="Enter website URL" />
                        {:else if project.website}
                            <a href={project.website} target="_blank" rel="noopener noreferrer" class="website-link">
                                <i class="fas fa-external-link-alt"></i> Visit Website
                            </a>
                        {:else}
                            <span class="no-link">No website yet</span>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Sample Website</label>
                        {#if editMode}
                            <input bind:value={project.sample_website} placeholder="Enter sample website URL" />
                        {:else if project.sample_website}
                            <a href={project.sample_website} target="_blank" rel="noopener noreferrer" class="sample-link">
                                <i class="fas fa-globe"></i> View Sample
                            </a>
                        {:else}
                            <span class="no-link">No sample website</span>
                        {/if}
                    </div>
                </div>
            </section>

            <!-- Milestones Section -->
            <section class="milestones-section">
                <div class="section-header">
                    <h2>Milestones</h2>
                    <button class="add-btn" on:click={() => document.getElementById('newMilestoneForm').style.display = 'block'}>
                        <i class="fas fa-plus"></i> Add Milestone
                    </button>
                </div>

                <form 
                    id="newMilestoneForm" 
                    class="new-milestone-form" 
                    style="display: none;"
                    on:submit|preventDefault={addMilestone}
                >
                    <input
                        bind:value={newMilestone.title}
                        placeholder="Milestone title"
                        required
                    />
                    <textarea
                        bind:value={newMilestone.description}
                        placeholder="Description"
                        rows="2"
                    />
                    <input
                        type="date"
                        bind:value={newMilestone.due_date}
                    />
                    <select bind:value={newMilestone.status}>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <div class="form-actions">
                        <button type="submit" class="save-btn">Add Milestone</button>
                        <button 
                            type="button" 
                            class="cancel-btn"
                            on:click={() => document.getElementById('newMilestoneForm').style.display = 'none'}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <div class="milestones-grid">
                    {#each project.milestones as milestone}
                        <div class="milestone-card">
                            <div class="milestone-header">
                                <h3>{milestone.title}</h3>
                                <span class="status-badge {milestone.status.toLowerCase().replace(' ', '-')}">
                                    {milestone.status}
                                </span>
                            </div>
                            <p>{milestone.description}</p>
                            {#if milestone.due_date}
                                <div class="due-date">
                                    <i class="fas fa-calendar"></i>
                                    Due: {formatDate(milestone.due_date)}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </section>

            <!-- Notes Section -->
            <section class="notes-section">
                <div class="section-header">
                    <h2>Notes</h2>
                </div>

                <div class="new-note">
                    <textarea
                        bind:value={newNote}
                        placeholder="Add a note..."
                        rows="2"
                    />
                    <button class="add-btn" on:click={addNote} disabled={!newNote.trim()}>
                        <i class="fas fa-plus"></i> Add Note
                    </button>
                </div>

                <div class="notes-list">
                    {#each project.notes as note}
                        <div class="note-card">
                            <p>{note.content}</p>
                            <div class="note-meta">
                                Added on {formatDate(note.created_at)}
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
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
        margin-bottom: 2rem;
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #4a5568;
        text-decoration: none;
        margin-bottom: 1rem;
    }

    .back-link:hover {
        color: #2d3748;
    }

    h1 {
        font-size: 2rem;
        color: #1a202c;
        margin: 0;
    }

    .project-content {
        display: grid;
        gap: 2rem;
    }

    section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    h2 {
        font-size: 1.5rem;
        color: #2d3748;
        margin: 0;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-size: 0.875rem;
        color: #4a5568;
        font-weight: 500;
    }

    input, select, textarea {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 1rem;
    }

    .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .status-badge.active {
        background: #c6f6d5;
        color: #22543d;
    }

    .status-badge.on-hold {
        background: #feebc8;
        color: #744210;
    }

    .status-badge.completed {
        background: #e2e8f0;
        color: #2d3748;
    }

    .website-link, .sample-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    }

    .website-link {
        background: #4c1d95;
        color: white;
    }

    .sample-link {
        background: #2563eb;
        color: white;
    }

    .website-link:hover {
        background: #6d28d9;
    }

    .sample-link:hover {
        background: #1d4ed8;
    }

    .no-link {
        color: #718096;
        font-style: italic;
    }

    .milestones-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .milestone-card {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
    }

    .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 0.5rem;
    }

    .milestone-card h3 {
        font-size: 1.125rem;
        color: #2d3748;
        margin: 0;
    }

    .due-date {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #718096;
        margin-top: 0.5rem;
    }

    .new-milestone-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
    }

    .form-actions {
        display: flex;
        gap: 0.5rem;
    }

    .notes-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .note-card {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
    }

    .note-card p {
        margin: 0 0 0.5rem 0;
        color: #2d3748;
    }

    .note-meta {
        font-size: 0.875rem;
        color: #718096;
    }

    .new-note {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .new-note textarea {
        flex: 1;
    }

    button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .edit-btn {
        background: #4c1d95;
        color: white;
    }

    .save-btn {
        background: #059669;
        color: white;
    }

    .cancel-btn {
        background: #6b7280;
        color: white;
    }

    .add-btn {
        background: #4c1d95;
        color: white;
    }

    button:hover {
        opacity: 0.9;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .project-page {
            padding: 1rem;
        }

        .info-grid {
            grid-template-columns: 1fr;
        }

        .milestones-grid {
            grid-template-columns: 1fr;
        }

        .new-note {
            flex-direction: column;
        }
    }
</style>
