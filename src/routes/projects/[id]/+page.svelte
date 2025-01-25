<script lang="ts">
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { fade, fly } from 'svelte/transition';

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
            // First load the project with milestones
            const { data: projectData, error: projectError } = await supabase
                .from('active_projects')
                .select(`
                    *,
                    milestones (
                        id,
                        title,
                        description,
                        due_date,
                        status,
                        priority,
                        created_at,
                        updated_at
                    )
                `)
                .eq('id', $page.params.id)
                .single();

            if (projectError) throw projectError;

            // Then load notes through the junction table
            const { data: notesData, error: notesError } = await supabase
                .from('project_notes')
                .select(`
                    notes (
                        id,
                        content,
                        created_at,
                        updated_at
                    )
                `)
                .eq('project_id', $page.params.id)
                .order('created_at', { foreignTable: 'notes', ascending: false });

            if (notesError) throw notesError;

            // Combine all data
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
            const { data, error: err } = await supabase
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
                .eq('id', project.id)
                .select();

            if (err) throw err;
            if (!data || data.length === 0) throw new Error('No data returned from update');
            
            // Update the local project with the returned data
            project = { ...project, ...data[0] };
            editMode = false;
        } catch (err) {
            console.error('Error updating project:', err);
            error = err.message;
        }
    }

    function toggleEdit() {
        editMode = !editMode;
        if (!editMode) {
            // If canceling edit, reload the project to reset any changes
            loadProject();
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
            // First create the note
            const { data: noteData, error: noteError } = await supabase
                .from('notes')
                .insert([{
                    content: newNote.trim(),
                    user_id: $user?.id
                }])
                .select()
                .single();

            if (noteError) throw noteError;

            // Then create the relationship
            const { error: relationError } = await supabase
                .from('project_notes')
                .insert([{
                    project_id: project.id,
                    note_id: noteData.id,
                    user_id: $user?.id
                }]);

            if (relationError) throw relationError;

            // Update the UI
            project.notes = [noteData, ...project.notes];
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

<div class="project-detail" in:fade={{ duration: 200 }}>
    <!-- Header -->
    <header class="header" in:fly={{ y: -20, duration: 300 }}>
        <div class="header-content">
            <h1>{project?.company_name || 'Loading...'}</h1>
            <div class="header-actions">
                <button class="icon-button close-button" on:click={() => goto('/projects')} title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </header>

    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading project details...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <p>{error}</p>
            <button class="retry-button" on:click={loadProject}>Retry</button>
        </div>
    {:else if project}
        <div class="content-grid" in:fly={{ y: 20, duration: 300, delay: 200 }}>
            <!-- Project Info Card -->
            <section class="card project-info">
                <div class="card-header">
                    <h2>Project Details</h2>
                    {#if editMode}
                        <div class="button-group">
                            <button class="button primary" on:click={updateProject}>
                                <i class="fas fa-save"></i> Save
                            </button>
                            <button class="button secondary" on:click={() => editMode = false}>
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    {:else}
                        <button class="button secondary" on:click={() => editMode = true}>
                            <i class="fas fa-pen"></i> Edit
                        </button>
                    {/if}
                </div>

                <div class="summary-section">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-label">Status</span>
                            <span class="stat-value status-badge {project.status?.toLowerCase()}">{project.status || 'N/A'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Partner</span>
                            <span class="stat-value">{project.partner_name || 'N/A'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Industry</span>
                            <span class="stat-value">{project.industry || 'N/A'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Ownership</span>
                            <span class="stat-value">{project.ownership || 0}%</span>
                        </div>
                    </div>

                    <div class="summary-stats secondary">
                        <div class="stat-item">
                            <span class="stat-label">Dev Revenue</span>
                            <span class="stat-value">{project.development_revenue || '$0'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Add. Revenue</span>
                            <span class="stat-value">{project.additional_revenue || '$0'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Exclusivity</span>
                            <span class="stat-value">{project.exclusivity || 'None'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Website</span>
                            {#if project.website}
                                <a href={project.website} target="_blank" rel="noopener noreferrer" class="website-link">
                                    <i class="fas fa-external-link-alt"></i> Visit
                                </a>
                            {:else}
                                <span class="stat-value">N/A</span>
                            {/if}
                        </div>
                    </div>

                    <div class="milestone-summary">
                        <div class="milestone-header">
                            <h3>Milestones</h3>
                            <div class="milestone-stats">
                                <span class="milestone-stat">
                                    <i class="fas fa-check text-green-500"></i>
                                    {project.milestones?.filter(m => m.status === 'Completed').length || 0} Complete
                                </span>
                                <span class="milestone-stat">
                                    <i class="fas fa-clock text-blue-500"></i>
                                    {project.milestones?.filter(m => m.status === 'In Progress').length || 0} In Progress
                                </span>
                                <span class="milestone-stat">
                                    <i class="fas fa-hourglass text-gray-500"></i>
                                    {project.milestones?.filter(m => m.status === 'Not Started').length || 0} Pending
                                </span>
                            </div>
                        </div>

                        {#if project.milestones && project.milestones.length > 0}
                            <div class="milestone-chips">
                                {#each project.milestones.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 3) as milestone}
                                    <div class="milestone-chip {milestone.status.toLowerCase()}">
                                        <div class="milestone-chip-header">
                                            <span class="milestone-title">{milestone.title}</span>
                                            <span class="status-dot"></span>
                                        </div>
                                        <div class="milestone-chip-footer">
                                            <span class="milestone-date">
                                                <i class="fas fa-calendar"></i> 
                                                {new Date(milestone.due_date).toLocaleDateString()}
                                            </span>
                                            <span class="milestone-priority {milestone.priority?.toLowerCase()}">
                                                {milestone.priority}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                                {#if project.milestones.length > 3}
                                    <div class="milestone-chip more">
                                        <span>+{project.milestones.length - 3} more milestones</span>
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <p class="no-milestones">No milestones yet</p>
                        {/if}
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <label>Company</label>
                        {#if editMode}
                            <input type="text" bind:value={project.company_name} />
                        {:else}
                            <p>{project.company_name}</p>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Partner</label>
                        {#if editMode}
                            <input type="text" bind:value={project.partner_name} />
                        {:else}
                            <p>{project.partner_name}</p>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Industry</label>
                        {#if editMode}
                            <input type="text" bind:value={project.industry} />
                        {:else}
                            <p>{project.industry}</p>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Website</label>
                        {#if editMode}
                            <input type="url" bind:value={project.website} />
                        {:else}
                            <a href={project.website} target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i> Visit Website
                            </a>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Ownership %</label>
                        {#if editMode}
                            <input type="number" bind:value={project.ownership} min="0" max="100" />
                        {:else}
                            <p>{project.ownership}%</p>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Development Revenue</label>
                        {#if editMode}
                            <input type="text" bind:value={project.development_revenue} />
                        {:else}
                            <p>{project.development_revenue}</p>
                        {/if}
                    </div>
                </div>
            </section>

            <!-- Milestones Card -->
            <section class="card milestones">
                <div class="card-header">
                    <h2>Milestones</h2>
                    <button class="button primary" on:click={() => document.getElementById('newMilestoneForm').style.display = 'block'}>
                        <i class="fas fa-plus"></i> Add Milestone
                    </button>
                </div>

                <div class="milestone-list">
                    {#each project.milestones as milestone}
                        <div class="milestone-item" class:completed={milestone.status === 'Completed'}>
                            <div class="milestone-header">
                                <h3>{milestone.title}</h3>
                                <span class="status-badge {milestone.status.toLowerCase()}">{milestone.status}</span>
                            </div>
                            <p class="description">{milestone.description}</p>
                            <div class="milestone-footer">
                                <span class="due-date">
                                    <i class="fas fa-calendar"></i> {new Date(milestone.due_date).toLocaleDateString()}
                                </span>
                                <span class="priority {milestone.priority?.toLowerCase()}">
                                    <i class="fas fa-flag"></i> {milestone.priority}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <!-- Notes Card -->
            <section class="card notes">
                <div class="card-header">
                    <h2>Notes</h2>
                </div>

                <div class="notes-container">
                    <div class="note-input">
                        <textarea 
                            bind:value={newNote}
                            placeholder="Add a note..."
                            rows="3"
                        ></textarea>
                        <button class="button primary" on:click={addNote} disabled={!newNote.trim()}>
                            <i class="fas fa-plus"></i> Add Note
                        </button>
                    </div>

                    <div class="note-list">
                        {#each project.notes as note}
                            <div class="note-item">
                                <p>{note.content}</p>
                                <div class="note-meta">
                                    <span class="timestamp">
                                        <i class="fas fa-clock"></i> {new Date(note.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </section>
        </div>
    {/if}
</div>

<style>
    .project-detail {
        height: 100vh;
        overflow-y: auto;
        background-color: #f8fafc;
    }

    .header {
        position: sticky;
        top: 0;
        background-color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 10;
        padding: 1rem;
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a202c;
        margin: 0;
    }

    .content-grid {
        max-width: 1200px;
        margin: 2rem auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        padding: 0 1rem;
    }

    .card {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .card-header {
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .card-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #2d3748;
        margin: 0;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .info-item label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #4a5568;
    }

    .button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: all 0.2s;
        border: none;
        cursor: pointer;
    }

    .button.primary {
        background-color: #3b82f6;
        color: white;
    }

    .button.primary:hover {
        background-color: #2563eb;
    }

    .button.secondary {
        background-color: #e2e8f0;
        color: #4a5568;
    }

    .button.secondary:hover {
        background-color: #cbd5e1;
    }

    .icon-button {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: #f1f5f9;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
    }

    .icon-button:hover {
        background: #e2e8f0;
        color: #475569;
    }

    .close-button {
        font-size: 1.25rem;
    }

    .milestone-list {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .milestone-item {
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        padding: 1rem;
    }

    .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status-badge.active {
        background-color: #dcfce7;
        color: #166534;
    }

    .status-badge.completed {
        background-color: #f0fdf4;
        color: #15803d;
    }

    .status-badge.on-hold {
        background-color: #fef3c7;
        color: #92400e;
    }

    .status-badge.cancelled {
        background-color: #fee2e2;
        color: #991b1b;
    }

    .text-green-500 {
        color: #22c55e;
    }

    .text-blue-500 {
        color: #3b82f6;
    }

    .text-gray-500 {
        color: #64748b;
    }

    .website-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        background-color: #f1f5f9;
        color: #3b82f6;
        font-size: 0.875rem;
        text-decoration: none;
        transition: all 0.2s;
    }

    .website-link:hover {
        background-color: #e2e8f0;
        color: #2563eb;
    }

    .notes-container {
        padding: 1rem;
    }

    .note-input {
        margin-bottom: 1rem;
    }

    .note-input textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        margin-bottom: 0.5rem;
        resize: vertical;
    }

    .note-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .note-item {
        background: #f8fafc;
        border-radius: 0.375rem;
        padding: 1rem;
    }

    .note-meta {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        gap: 1rem;
    }

    .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        gap: 1rem;
        color: #dc2626;
    }

    .summary-section {
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
    }

    .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .summary-stats.secondary {
        margin-top: 1.5rem;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #64748b;
        font-weight: 500;
    }

    .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
    }

    .milestone-summary {
        margin-top: 1.5rem;
    }

    .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .milestone-stats {
        display: flex;
        gap: 1rem;
    }

    .milestone-stat {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        color: #64748b;
    }

    .milestone-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .milestone-chip {
        display: flex;
        flex-direction: column;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background: white;
        border: 1px solid #e2e8f0;
        transition: all 0.2s;
    }

    .milestone-chip:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .milestone-chip.completed {
        background-color: #f0fdf4;
        border-color: #bbf7d0;
    }

    .milestone-chip.in-progress {
        background-color: #eff6ff;
        border-color: #bfdbfe;
    }

    .milestone-chip.not-started {
        background-color: #f8fafc;
        border-color: #e2e8f0;
    }

    .milestone-chip.more {
        background: #f1f5f9;
        color: #64748b;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .milestone-chip.more:hover {
        background: #e2e8f0;
    }

    .milestone-chip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
    }

    .milestone-title {
        font-weight: 500;
        color: #1e293b;
    }

    .status-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background-color: #64748b;
    }

    .milestone-chip-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: #64748b;
    }

    .milestone-date {
        margin-right: 0.5rem;
    }

    .milestone-priority {
        font-weight: 500;
    }

    .milestone-priority.low {
        color: #f7d2c4;
    }

    .milestone-priority.medium {
        color: #f0e2cc;
    }

    .milestone-priority.high {
        color: #f7cac9;
    }

    .no-milestones {
        color: #64748b;
        font-size: 0.875rem;
        font-style: italic;
    }

    @media (max-width: 768px) {
        .content-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
        }

        .info-grid {
            grid-template-columns: 1fr;
        }

        .header-content {
            padding: 0 1rem;
        }
    }
</style>
