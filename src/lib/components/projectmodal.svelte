<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { fade, fly, slide } from 'svelte/transition';
    import { format, parseISO, differenceInDays } from 'date-fns';
    
    export let show = false;
    export let projectId: string | null = null;
    export let projectType: 'active' | 'mentor' | 'probono' = 'active';
    
    const dispatch = createEventDispatcher();
    
    let loading = true;
    let error: string | null = null;
    let activeTab = 'overview';
    let editMode = false;
    let project: any = null;
    let milestones: any[] = [];
    let notes: any[] = [];
    let teamMembers: any[] = [];
    
    // New milestone form
    let newMilestone = {
        title: '',
        description: '',
        due_date: '',
        status: 'Not Started',
        priority: 'Medium'
    };
    
    // New note form
    let newNote = '';
    
    // Edit milestone modal
    let showMilestoneModal = false;
    let currentMilestone: any = null;
    
    onMount(async () => {
        if (show && projectId) {
            await loadProject();
        }
    });
    
    $: if (show && projectId && !project) {
        loadProject();
    }
    
    async function loadProject() {
        loading = true;
        error = null;
        
        try {
            let tableName = '';
            switch (projectType) {
                case 'active': tableName = 'active_projects'; break;
                case 'mentor': tableName = 'mentor_to_launch_projects'; break;
                case 'probono': tableName = 'pro_bono_projects'; break;
            }
            
            // Fetch project data
            const { data, error: err } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', projectId)
                .single();
                
            if (err) throw err;
            if (!data) throw new Error('Project not found');
            
            project = data;
            
            // Parse milestones from JSON if they exist
            if (project.milestones) {
                if (typeof project.milestones === 'string') {
                    try {
                        milestones = JSON.parse(project.milestones);
                    } catch (e) {
                        milestones = [];
                    }
                } else {
                    milestones = project.milestones;
                }
            } else {
                milestones = [];
            }
            
            // Fetch notes if they exist in a separate table
            const { data: notesData } = await supabase
                .from('project_notes')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });
                
            notes = notesData || [];
            
            // Fetch team members if they exist
            if (project.team_members) {
                if (typeof project.team_members === 'string') {
                    try {
                        teamMembers = JSON.parse(project.team_members);
                    } catch (e) {
                        teamMembers = [];
                    }
                } else {
                    teamMembers = project.team_members || [];
                }
            } else {
                teamMembers = [];
            }
            
        } catch (e) {
            console.error('Error loading project:', e);
            error = e.message;
        } finally {
            loading = false;
        }
    }
    
    function closeModal() {
        show = false;
        dispatch('close');
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'MMM d, yyyy');
        } catch (e) {
            return dateString;
        }
    }
    
    function getCompletionPercentage() {
        if (!milestones || milestones.length === 0) return 0;
        const completed = milestones.filter(m => m.status === 'Completed').length;
        return Math.round((completed / milestones.length) * 100);
    }
    
    async function addMilestone() {
        if (!newMilestone.title || !newMilestone.due_date) {
            error = 'Title and due date are required for milestones';
            return;
        }
        
        try {
            const milestone = {
                ...newMilestone,
                id: crypto.randomUUID(),
                project_id: projectId,
                created_at: new Date().toISOString()
            };
            
            milestones = [...milestones, milestone];
            
            // Update project milestones in database
            let tableName = '';
            switch (projectType) {
                case 'active': tableName = 'active_projects'; break;
                case 'mentor': tableName = 'mentor_to_launch_projects'; break;
                case 'probono': tableName = 'pro_bono_projects'; break;
            }
            
            const { error: err } = await supabase
                .from(tableName)
                .update({ milestones })
                .eq('id', projectId);
                
            if (err) throw err;
            
            // Reset form
            newMilestone = {
                title: '',
                description: '',
                due_date: '',
                status: 'Not Started',
                priority: 'Medium'
            };
            
            dispatch('updated');
            
        } catch (e) {
            console.error('Error adding milestone:', e);
            error = e.message;
        }
    }
    
    async function updateMilestone(milestone) {
        try {
            const index = milestones.findIndex(m => m.id === milestone.id);
            if (index !== -1) {
                milestones[index] = milestone;
                milestones = [...milestones]; // Trigger reactivity
                
                // Update project milestones in database
                let tableName = '';
                switch (projectType) {
                    case 'active': tableName = 'active_projects'; break;
                    case 'mentor': tableName = 'mentor_to_launch_projects'; break;
                    case 'probono': tableName = 'pro_bono_projects'; break;
                }
                
                const { error: err } = await supabase
                    .from(tableName)
                    .update({ milestones })
                    .eq('id', projectId);
                    
                if (err) throw err;
                
                showMilestoneModal = false;
                currentMilestone = null;
                dispatch('updated');
            }
        } catch (e) {
            console.error('Error updating milestone:', e);
            error = e.message;
        }
    }
    
    async function addNote() {
        if (!newNote.trim()) return;
        
        try {
            const note = {
                content: newNote,
                project_id: projectId,
                created_at: new Date().toISOString()
            };
            
            const { data, error: err } = await supabase
                .from('project_notes')
                .insert([note])
                .select();
                
            if (err) throw err;
            
            notes = [data[0], ...notes];
            newNote = '';
            dispatch('updated');
            
        } catch (e) {
            console.error('Error adding note:', e);
            error = e.message;
        }
    }
    
    function editMilestone(milestone) {
        currentMilestone = { ...milestone };
        showMilestoneModal = true;
    }
    
    async function updateProject() {
        if (!project) return;
        
        try {
            let tableName = '';
            switch (projectType) {
                case 'active': tableName = 'active_projects'; break;
                case 'mentor': tableName = 'mentor_to_launch_projects'; break;
                case 'probono': tableName = 'pro_bono_projects'; break;
            }
            
            const { error: err } = await supabase
                .from(tableName)
                .update(project)
                .eq('id', projectId);
                
            if (err) throw err;
            
            editMode = false;
            dispatch('updated');
            
        } catch (e) {
            console.error('Error updating project:', e);
            error = e.message;
        }
    }
    
    function getDaysRemaining(dateString) {
        if (!dateString) return 'No date set';
        const days = differenceInDays(parseISO(dateString), new Date());
        if (days < 0) return 'Overdue';
        if (days === 0) return 'Due today';
        return `${days} days remaining`;
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click={closeModal} in:fade={{ duration: 200 }}>
        <div 
            class="modal-content"
            on:click|stopPropagation
            in:fly={{ y: 20, duration: 300 }}
        >
            {#if loading}
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading project details...</p>
                </div>
            {:else if error}
                <div class="error-container">
                    <p class="error-message">{error}</p>
                    <button on:click={closeModal}>Close</button>
                </div>
            {:else if project}
                <div class="modal-header">
                    <div class="company-info">
                        <div class="company-icon">{project.company_name?.charAt(0) || '?'}</div>
                        <div class="company-details">
                            <h2>{project.company_name || 'Unnamed Project'}</h2>
                            <div class="company-meta">
                                <span class="status-badge {project.status?.toLowerCase() || 'active'}">{project.status || 'Active'}</span>
                                {#if project.industry}
                                    <span class="industry-tag">{project.industry}</span>
                                {/if}
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        {#if !editMode}
                            <button class="edit-button" on:click={() => editMode = true}>
                                <i class="fas fa-pencil"></i> Edit
                            </button>
                        {:else}
                            <button class="save-button" on:click={updateProject}>
                                <i class="fas fa-save"></i> Save
                            </button>
                            <button class="cancel-button" on:click={() => editMode = false}>
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        {/if}
                        <button class="close-button" on:click={closeModal}>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="tabs">
                    <button class="tab-button" class:active={activeTab === 'overview'} on:click={() => activeTab = 'overview'}>
                        <i class="fas fa-home"></i> Overview
                    </button>
                    <button class="tab-button" class:active={activeTab === 'details'} on:click={() => activeTab = 'details'}>
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="tab-button" class:active={activeTab === 'milestones'} on:click={() => activeTab = 'milestones'}>
                        <i class="fas fa-flag"></i> Milestones
                    </button>
                    <button class="tab-button" class:active={activeTab === 'notes'} on:click={() => activeTab = 'notes'}>
                        <i class="fas fa-sticky-note"></i> Notes
                    </button>
                    <button class="tab-button" class:active={activeTab === 'team'} on:click={() => activeTab = 'team'}>
                        <i class="fas fa-users"></i> Team
                    </button>
                </div>
                
                <div class="tab-content">
                    <!-- Overview Tab -->
                    {#if activeTab === 'overview'}
                        <div class="overview-tab" in:fade={{ duration: 200 }}>
                            <div class="overview-grid">
                                <div class="overview-card summary-card">
                                    <h3>Project Summary</h3>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: {getCompletionPercentage()}%"></div>
                                        </div>
                                        <div class="progress-stats">
                                            <span>{milestones.filter(m => m.status === 'Completed').length} of {milestones.length} milestones complete</span>
                                            <span>{getCompletionPercentage()}% complete</span>
                                        </div>
                                    </div>
                                    
                                    <div class="key-metrics">
                                        {#if projectType === 'active'}
                                            <div class="metric">
                                                <span class="metric-value">{project.ownership || 0}%</span>
                                                <span class="metric-label">Ownership</span>
                                            </div>
                                            <div class="metric">
                                                <span class="metric-value">{project.development_revenue || '$0'}</span>
                                                <span class="metric-label">Dev Revenue</span>
                                            </div>
                                        {/if}
                                        <div class="metric">
                                            <span class="metric-value">{formatDate(project.created_at)}</span>
                                            <span class="metric-label">Started</span>
                                        </div>
                                        <div class="metric">
                                            <span class="metric-value">{formatDate(project.target_launch_date)}</span>
                                            <span class="metric-label">Target Launch</span>
                                        </div>
                                    </div>
                                    
                                    {#if project.website}
                                        <div class="website-link">
                                            <a href={project.website} target="_blank" rel="noopener noreferrer">
                                                <i class="fas fa-external-link-alt"></i> Visit Website
                                            </a>
                                        </div>
                                    {/if}
                                </div>
                                
                                <div class="overview-card milestones-preview">
                                    <h3>Upcoming Milestones</h3>
                                    {#if milestones.length === 0}
                                        <p class="empty-state">No milestones added yet</p>
                                    {:else}
                                        <div class="milestone-list">
                                            {#each milestones.filter(m => m.status !== 'Completed').slice(0, 3) as milestone}
                                                <div class="milestone-item">
                                                    <div class="milestone-title">
                                                        <i class="fas fa-flag"></i>
                                                        <span>{milestone.title}</span>
                                                    </div>
                                                    <div class="milestone-date">
                                                        <span class="due-date">{formatDate(milestone.due_date)}</span>
                                                        <span class="days-remaining">{getDaysRemaining(milestone.due_date)}</span>
                                                    </div>
                                                </div>
                                            {/each}
                                            {#if milestones.filter(m => m.status !== 'Completed').length > 3}
                                                <button class="view-all-button" on:click={() => activeTab = 'milestones'}>
                                                    View all milestones
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                
                                <div class="overview-card recent-notes">
                                    <h3>Recent Notes</h3>
                                    {#if notes.length === 0}
                                        <p class="empty-state">No notes added yet</p>
                                    {:else}
                                        <div class="notes-preview">
                                            {#each notes.slice(0, 2) as note}
                                                <div class="note-preview">
                                                    <p class="note-content">{note.content}</p>
                                                    <span class="note-date">{formatDate(note.created_at)}</span>
                                                </div>
                                            {/each}
                                            {#if notes.length > 2}
                                                <button class="view-all-button" on:click={() => activeTab = 'notes'}>
                                                    View all notes
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Details Tab -->
                    {#if activeTab === 'details'}
                        <div class="details-tab" in:fade={{ duration: 200 }}>
                            <div class="details-grid">
                                <div class="details-section">
                                    <h3>Company Information</h3>
                                    <div class="details-form">
                                        <div class="form-group">
                                            <label for="company_name">Company Name</label>
                                            <input 
                                                id="company_name" 
                                                type="text" 
                                                bind:value={project.company_name}
                                                disabled={!editMode}
                                            />
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="industry">Industry</label>
                                            <input 
                                                id="industry" 
                                                type="text" 
                                                bind:value={project.industry}
                                                disabled={!editMode}
                                            />
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="website">Website</label>
                                            <input 
                                                id="website" 
                                                type="url" 
                                                bind:value={project.website}
                                                disabled={!editMode}
                                            />
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="status">Status</label>
                                            <select 
                                                id="status" 
                                                bind:value={project.status}
                                                disabled={!editMode}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="On Hold">On Hold</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="details-section">
                                    <h3>Partner Information</h3>
                                    <div class="details-form">
                                        <div class="form-group">
                                            <label for="partner_name">Partner Name</label>
                                            <input 
                                                id="partner_name" 
                                                type="text" 
                                                bind:value={project.partner_name}
                                                disabled={!editMode}
                                            />
                                        </div>
                                        
                                        {#if projectType === 'active'}
                                            <div class="form-group">
                                                <label for="ownership">Ownership %</label>
                                                <input 
                                                    id="ownership" 
                                                    type="number" 
                                                    bind:value={project.ownership}
                                                    disabled={!editMode}
                                                />
                                            </div>
                                            
                                            <div class="form-group">
                                                <label for="exclusivity">Exclusivity</label>
                                                <input 
                                                    id="exclusivity" 
                                                    type="text" 
                                                    bind:value={project.exclusivity}
                                                    disabled={!editMode}
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                                
                                {#if projectType === 'active'}
                                    <div class="details-section">
                                        <h3>Financial Details</h3>
                                        <div class="details-form">
                                            <div class="form-group">
                                                <label for="development_revenue">Development Revenue</label>
                                                <input 
                                                    id="development_revenue" 
                                                    type="text" 
                                                    bind:value={project.development_revenue}
                                                    disabled={!editMode}
                                                />
                                            </div>
                                            
                                            <div class="form-group">
                                                <label for="additional_revenue">Additional Revenue</label>
                                                <input 
                                                    id="additional_revenue" 
                                                    type="text" 
                                                    bind:value={project.additional_revenue}
                                                    disabled={!editMode}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                                
                                <div class="details-section">
                                    <h3>Timeline</h3>
                                    <div class="details-form">
                                        <div class="form-group">
                                            <label for="created_at">Start Date</label>
                                            <input 
                                                id="created_at" 
                                                type="date" 
                                                value={project.created_at ? project.created_at.split('T')[0] : ''}
                                                on:change={(e) => project.created_at = e.target.value}
                                                disabled={!editMode}
                                            />
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="target_launch_date">Target Launch Date</label>
                                            <input 
                                                id="target_launch_date" 
                                                type="date" 
                                                value={project.target_launch_date ? project.target_launch_date.split('T')[0] : ''}
                                                on:change={(e) => project.target_launch_date = e.target.value}
                                                disabled={!editMode}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Milestones Tab -->
                    {#if activeTab === 'milestones'}
                        <div class="milestones-tab" in:fade={{ duration: 200 }}>
                            <div class="milestones-header">
                                <h3>Project Milestones</h3>
                                <div class="milestone-filters">
                                    <select>
                                        <option value="all">All Milestones</option>
                                        <option value="completed">Completed</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="not-started">Not Started</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="milestones-list">
                                {#if milestones.length === 0}
                                    <div class="empty-state">
                                        <p>No milestones added yet</p>
                                        <button class="add-button" on:click={() => editMilestone({ id: null, title: '', description: '', due_date: '', status: 'Not Started', priority: 'Medium' })}>
                                            <i class="fas fa-plus"></i> Add First Milestone
                                        </button>
                                    </div>
                                {:else}
                                    {#each milestones as milestone}
                                        <div class="milestone-card" class:completed={milestone.status === 'Completed'}>
                                            <div class="milestone-header">
                                                <h4>{milestone.title}</h4>
                                                <div class="milestone-status {milestone.status?.toLowerCase().replace(' ', '-') || 'not-started'}">
                                                    {milestone.status || 'Not Started'}
                                                </div>
                                            </div>
                                            
                                            {#if milestone.description}
                                                <p class="milestone-description">{milestone.description}</p>
                                            {/if}
                                            
                                            <div class="milestone-meta">
                                                <div class="milestone-date">
                                                    <i class="fas fa-calendar"></i> Due: {formatDate(milestone.due_date)}
                                                </div>
                                                
                                                {#if milestone.priority}
                                                    <div class="milestone-priority {milestone.priority?.toLowerCase() || 'medium'}">
                                                        {milestone.priority || 'Medium'}
                                                    </div>
                                                {/if}
                                            </div>
                                            
                                            <div class="milestone-actions">
                                                <button class="edit-button" on:click={() => editMilestone(milestone)}>
                                                    <i class="fas fa-pencil"></i> Edit
                                                </button>
                                                
                                                {#if milestone.status !== 'Completed'}
                                                    <button class="complete-button" on:click={() => updateMilestone({ ...milestone, status: 'Completed' })}>
                                                        <i class="fas fa-check"></i> Mark Complete
                                                    </button>
                                                {:else}
                                                    <button class="reopen-button" on:click={() => updateMilestone({ ...milestone, status: 'In Progress' })}>
                                                        <i class="fas fa-redo"></i> Reopen
                                                    </button>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                    
                                    <button class="add-milestone-button" on:click={() => editMilestone({ id: null, title: '', description: '', due_date: '', status: 'Not Started', priority: 'Medium' })}>
                                        <i class="fas fa-plus"></i> Add Milestone
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Notes Tab -->
                    {#if activeTab === 'notes'}
                        <div class="notes-tab" in:fade={{ duration: 200 }}>
                            <div class="add-note-section">
                                <h3>Add Note</h3>
                                <div class="note-form">
                                    <textarea 
                                        bind:value={newNote} 
                                        placeholder="Enter a new note about this project..."
                                        rows="3"
                                    ></textarea>
                                    <button class="add-note-button" on:click={addNote} disabled={!newNote.trim()}>
                                        <i class="fas fa-plus"></i> Add Note
                                    </button>
                                </div>
                            </div>
                            
                            <div class="notes-list">
                                <h3>Project Notes</h3>
                                {#if notes.length === 0}
                                    <div class="empty-state">
                                        <p>No notes added yet</p>
                                    </div>
                                {:else}
                                    {#each notes as note}
                                        <div class="note-card">
                                            <div class="note-header">
                                                <span class="note-date">{formatDate(note.created_at)}</span>
                                            </div>
                                            <div class="note-content">{note.content}</div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/if}
                    
                    <!-- Team Tab -->
                    {#if activeTab === 'team'}
                        <div class="team-tab" in:fade={{ duration: 200 }}>
                            <div class="team-header">
                                <h3>Project Team</h3>
                                {#if editMode}
                                    <button class="add-team-member">
                                        <i class="fas fa-plus"></i> Add Team Member
                                    </button>
                                {/if}
                            </div>
                            
                            {#if teamMembers.length === 0}
                                <div class="empty-state">
                                    <p>No team members assigned yet</p>
                                    {#if editMode}
                                        <button class="add-button">
                                            <i class="fas fa-plus"></i> Add First Team Member
                                        </button>
                                    {/if}
                                </div>
                            {:else}
                                <div class="team-members-list">
                                    {#each teamMembers as member}
                                        <div class="team-member-card">
                                            <div class="member-avatar">
                                                {member.name?.charAt(0) || '?'}
                                            </div>
                                            <div class="member-info">
                                                <h4>{member.name}</h4>
                                                <p class="member-role">{member.role || 'Team Member'}</p>
                                            </div>
                                            {#if editMode}
                                                <button class="remove-member">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
                
                {#if showMilestoneModal}
                    <div class="milestone-modal" in:fade={{ duration: 150 }}>
                        <div class="milestone-modal-content" in:slide={{ duration: 200 }}>
                            <h3>{currentMilestone.id ? 'Edit Milestone' : 'Add Milestone'}</h3>
                            
                            <div class="milestone-form">
                                <div class="form-group">
                                    <label for="milestone-title">Title</label>
                                    <input 
                                        id="milestone-title" 
                                        type="text" 
                                        bind:value={currentMilestone.title}
                                        placeholder="Enter milestone title"
                                        required
                                    />
                                </div>
                                
                                <div class="form-group">
                                    <label for="milestone-description">Description</label>
                                    <textarea 
                                        id="milestone-description" 
                                        bind:value={currentMilestone.description}
                                        placeholder="Enter milestone description"
                                        rows="3"
                                    ></textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="milestone-due-date">Due Date</label>
                                        <input 
                                            id="milestone-due-date" 
                                            type="date" 
                                            bind:value={currentMilestone.due_date}
                                            required
                                        />
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="milestone-status">Status</label>
                                        <select id="milestone-status" bind:value={currentMilestone.status}>
                                            <option value="Not Started">Not Started</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="milestone-priority">Priority</label>
                                        <select id="milestone-priority" bind:value={currentMilestone.priority}>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button class="cancel-button" on:click={() => showMilestoneModal = false}>
                                        Cancel
                                    </button>
                                    <button 
                                        class="save-button" 
                                        on:click={() => {
                                            if (currentMilestone.id) {
                                                updateMilestone(currentMilestone);
                                            } else {
                                                addMilestone();
                                            }
                                        }}
                                        disabled={!currentMilestone.title || !currentMilestone.due_date}
                                    >
                                        {currentMilestone.id ? 'Update Milestone' : 'Add Milestone'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-content {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        display: flex;
        flex-direction: column;
    }
    
    .loading-container, .error-container {
        padding: 2rem;
        text-align: center;
    }
    
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-message {
        color: #e74c3c;
        margin-bottom: 1rem;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
    }
    
    .company-info {
        display: flex;
        align-items: center;
    }
    
    .company-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #3498db;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
        margin-right: 1rem;
    }
    
    .company-details {
        display: flex;
        flex-direction: column;
    }
    
    .company-details h2 {
        margin: 0;
        font-size: 1.5rem;
    }
    
    .company-meta {
        display: flex;
        align-items: center;
        margin-top: 0.25rem;
    }
    
    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-right: 0.5rem;
    }
    
    .status-badge.active {
        background-color: #2ecc71;
        color: white;
    }
    
    .status-badge.on-hold {
        background-color: #f39c12;
        color: white;
    }
    
    .status-badge.completed {
        background-color: #3498db;
        color: white;
    }
    
    .industry-tag {
        font-size: 0.75rem;
        color: #666;
        background-color: #f5f5f5;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }
    
    .header-actions {
        display: flex;
        align-items: center;
    }
    
    .header-actions button {
        margin-left: 0.5rem;
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
    }
    
    .header-actions button i {
        margin-right: 0.25rem;
    }
    
    .edit-button {
        background-color: #f8f9fa;
        color: #495057;
    }
    
    .save-button {
        background-color: #2ecc71;
        color: white;
    }
    
    .cancel-button {
        background-color: #f1f1f1;
        color: #333;
    }
    
    .close-button {
        background-color: transparent;
        color: #666;
        font-size: 1.25rem;
    }
    
    .tabs {
        display: flex;
        border-bottom: 1px solid #eee;
        padding: 0 1rem;
    }
    
    .tab-button {
        padding: 1rem 1.25rem;
        border: none;
        background: none;
        font-weight: 600;
        color: #666;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        display: flex;
        align-items: center;
    }
    
    .tab-button i {
        margin-right: 0.5rem;
    }
    
    .tab-button.active {
        color: #3498db;
        border-bottom-color: #3498db;
    }
    
    .tab-content {
        padding: 1.5rem;
        flex: 1;
        overflow-y: auto;
    }
    
    /* Overview Tab Styles */
    .overview-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    
    .overview-card {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .overview-card h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        color: #333;
    }
    
    .summary-card {
        grid-column: 1 / -1;
    }
    
    .progress-container {
        margin-bottom: 1.5rem;
    }
    
    .progress-bar {
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }
    
    .progress-fill {
        height: 100%;
        background-color: #3498db;
        border-radius: 4px;
    }
    
    .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: #666;
    }
    
    .key-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .metric {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .metric-value {
        font-size: 1.25rem;
        font-weight: bold;
        color: #333;
    }
    
    .metric-label {
        font-size: 0.75rem;
        color: #666;
        margin-top: 0.25rem;
    }
    
    .website-link {
        margin-top: 1rem;
    }
    
    .website-link a {
        color: #3498db;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        font-weight: 500;
    }
    
    .website-link a i {
        margin-right: 0.5rem;
    }
    
    .milestone-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .milestone-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: white;
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    .milestone-title {
        display: flex;
        align-items: center;
    }
    
    .milestone-title i {
        color: #f39c12;
        margin-right: 0.5rem;
    }
    
    .milestone-date {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }
    
    .due-date {
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    .days-remaining {
        font-size: 0.75rem;
        color: #666;
    }
    
    .notes-preview {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .note-preview {
        background-color: white;
        border-radius: 4px;
        padding: 0.75rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    .note-content {
        font-size: 0.9rem;
        margin: 0 0 0.5rem 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }
    
    .note-date {
        font-size: 0.75rem;
        color: #666;
    }
    
    .view-all-button {
        margin-top: 0.75rem;
        background: none;
        border: none;
        color: #3498db;
        cursor: pointer;
        font-size: 0.85rem;
        text-align: center;
        width: 100%;
        padding: 0.5rem;
    }
    
    .empty-state {
        text-align: center;
        color: #666;
        padding: 1.5rem;
    }
    
    /* Details Tab Styles */
    .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    
    .details-section {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .details-section h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        color: #333;
    }
    
    .details-form {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
    }
    
    .form-group label {
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
        color: #495057;
    }
    
    .form-group input, .form-group select, .form-group textarea {
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 0.9rem;
    }
    
    .form-group input:disabled, .form-group select:disabled, .form-group textarea:disabled {
        background-color: #f8f9fa;
        cursor: not-allowed;
    }
    
    /* Milestones Tab Styles */
    .milestones-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .milestones-header h3 {
        margin: 0;
    }
    
    .milestone-filters select {
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 0.9rem;
    }
    
    .milestones-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .milestone-card {
        background-color: white;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #f39c12;
    }
    
    .milestone-card.completed {
        border-left-color: #2ecc71;
        opacity: 0.8;
    }
    
    .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }
    
    .milestone-header h4 {
        margin: 0;
        font-size: 1.1rem;
    }
    
    .milestone-status {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .milestone-status.not-started {
        background-color: #f8f9fa;
        color: #6c757d;
    }
    
    .milestone-status.in-progress {
        background-color: #f39c12;
        color: white;
    }
    
    .milestone-status.completed {
        background-color: #2ecc71;
        color: white;
    }
    
    .milestone-description {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
        color: #666;
    }
    
    .milestone-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        font-size: 0.85rem;
    }
    
    .milestone-date {
        display: flex;
        align-items: center;
    }
    
    .milestone-date i {
        margin-right: 0.5rem;
        color: #6c757d;
    }
    
    .milestone-priority {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .milestone-priority.low {
        background-color: #e9ecef;
        color: #495057;
    }
    
    .milestone-priority.medium {
        background-color: #f39c12;
        color: white;
    }
    
    .milestone-priority.high {
        background-color: #e74c3c;
        color: white;
    }
    
    .milestone-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .milestone-actions button {
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
    }
    
    .milestone-actions button i {
        margin-right: 0.25rem;
    }
    
    .complete-button {
        background-color: #2ecc71;
        color: white;
    }
    
    .reopen-button {
        background-color: #f39c12;
        color: white;
    }
    
    .add-milestone-button, .add-button {
        background-color: #f8f9fa;
        color: #3498db;
        border: 1px dashed #3498db;
        border-radius: 8px;
        padding: 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        margin-top: 0.5rem;
    }
    
    .add-milestone-button i, .add-button i {
        margin-right: 0.5rem;
    }
    
    /* Notes Tab Styles */
    .add-note-section {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
    }
    
    .add-note-section h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        color: #333;
    }
    
    .note-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .note-form textarea {
        padding: 0.75rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 0.9rem;
        resize: vertical;
    }
    
    .add-note-button {
        align-self: flex-end;
        padding: 0.5rem 1rem;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
    }
    
    .add-note-button:disabled {
        background-color: #e9ecef;
        color: #6c757d;
        cursor: not-allowed;
    }
    
    .add-note-button i {
        margin-right: 0.5rem;
    }
    
    .notes-list {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .notes-list h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        color: #333;
    }
    
    .note-card {
        background-color: white;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1rem;
    }
    
    .note-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }
    
    /* Team Tab Styles */
    .team-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .team-header h3 {
        margin: 0;
    }
    
    .add-team-member {
        padding: 0.5rem 0.75rem;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
    }
    
    .add-team-member i {
        margin-right: 0.5rem;
    }
    
    .team-members-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .team-member-card {
        background-color: white;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
    }
    
    .member-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #3498db;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
    }
    
    .member-info {
        text-align: center;
    }
    
    .member-info h4 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
    }
    
    .member-role {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
    }
    
    .remove-member {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        color: #e74c3c;
        cursor: pointer;
        font-size: 1rem;
    }
    
    /* Milestone Modal Styles */
    .milestone-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1100;
    }
    
    .milestone-modal-content {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 500px;
        padding: 1.5rem;
    }
    
    .milestone-modal-content h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        font-size: 1.25rem;
    }
    
    .milestone-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    
    .form-actions button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
    }
    
    .form-actions .cancel-button {
        background-color: #f1f1f1;
        color: #333;
    }
    
    .form-actions .save-button {
        background-color: #3498db;
        color: white;
    }
    
    .form-actions .save-button:disabled {
        background-color: #e9ecef;
        color: #6c757d;
        cursor: not-allowed;
    }
    
    /* Responsive Styles */
    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            max-height: 95vh;
        }
        
        .modal-header {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .header-actions {
            margin-top: 1rem;
            align-self: flex-end;
        }
        
        .tabs {
            overflow-x: auto;
            padding: 0;
        }
        
        .tab-button {
            padding: 0.75rem;
            white-space: nowrap;
        }
        
        .overview-grid, .details-grid {
            grid-template-columns: 1fr;
        }
        
        .team-members-list {
            grid-template-columns: 1fr;
        }
        
        .milestone-modal-content {
            width: 95%;
            padding: 1rem;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>