<script lang="ts">
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { fade, fly } from 'svelte/transition';

    interface StaticWebsite {
        id: string;
        company_name: string;
        partner_name: string;
        industry: string;
        status: string;
        website: string;
        hosting_provider: string;
        domain_provider: string;
        monthly_cost: number;
        design_notes: string;
        maintenance_notes: string;
        created_at: string;
        updated_at: string;
    }

    let project: StaticWebsite | null = null;
    let loading = true;
    let error = '';
    let editMode = false;
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
            const { data, error: err } = await supabase
                .from('static_website_projects')
                .select('*')
                .eq('id', $page.params.id)
                .single();

            if (err) throw err;
            project = data;
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
                .from('static_website_projects')
                .update({
                    company_name: project.company_name,
                    partner_name: project.partner_name,
                    industry: project.industry,
                    status: project.status,
                    website: project.website,
                    hosting_provider: project.hosting_provider,
                    domain_provider: project.domain_provider,
                    monthly_cost: project.monthly_cost,
                    design_notes: project.design_notes,
                    maintenance_notes: project.maintenance_notes
                })
                .eq('id', project.id);

            if (err) throw err;
            editMode = false;
        } catch (err) {
            console.error('Error updating project:', err);
            error = err.message;
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString();
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
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
                        <label>Hosting Provider</label>
                        {#if editMode}
                            <input bind:value={project.hosting_provider} placeholder="e.g., Vercel, Netlify" />
                        {:else}
                            <span>{project.hosting_provider || 'Not specified'}</span>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Domain Provider</label>
                        {#if editMode}
                            <input bind:value={project.domain_provider} placeholder="e.g., GoDaddy, Namecheap" />
                        {:else}
                            <span>{project.domain_provider || 'Not specified'}</span>
                        {/if}
                    </div>

                    <div class="info-item">
                        <label>Monthly Cost</label>
                        {#if editMode}
                            <input 
                                type="number" 
                                bind:value={project.monthly_cost}
                                step="0.01"
                                min="0"
                            />
                        {:else}
                            <span>{formatCurrency(project.monthly_cost || 0)}/month</span>
                        {/if}
                    </div>
                </div>
            </section>

            <!-- Notes Section -->
            <section class="notes-section">
                <div class="section-header">
                    <h2>Notes</h2>
                </div>

                <div class="notes-grid">
                    <div class="note-card">
                        <h3>Design Notes</h3>
                        {#if editMode}
                            <textarea
                                bind:value={project.design_notes}
                                rows="4"
                                placeholder="Enter design notes..."
                            />
                        {:else}
                            <p>{project.design_notes || 'No design notes yet.'}</p>
                        {/if}
                    </div>

                    <div class="note-card">
                        <h3>Maintenance Notes</h3>
                        {#if editMode}
                            <textarea
                                bind:value={project.maintenance_notes}
                                rows="4"
                                placeholder="Enter maintenance notes..."
                            />
                        {:else}
                            <p>{project.maintenance_notes || 'No maintenance notes yet.'}</p>
                        {/if}
                    </div>
                </div>
            </section>

            <!-- Timeline Section -->
            <section class="timeline-section">
                <div class="section-header">
                    <h2>Timeline</h2>
                </div>

                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-flag"></i>
                        </div>
                        <div class="timeline-content">
                            <h3>Project Created</h3>
                            <p>{formatDate(project.created_at)}</p>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="timeline-content">
                            <h3>Last Updated</h3>
                            <p>{formatDate(project.updated_at)}</p>
                        </div>
                    </div>
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

    textarea {
        resize: vertical;
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

    .website-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #4c1d95;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    }

    .website-link:hover {
        background: #6d28d9;
    }

    .no-link {
        color: #718096;
        font-style: italic;
    }

    .notes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .note-card {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .note-card h3 {
        font-size: 1.125rem;
        color: #2d3748;
        margin: 0 0 1rem 0;
    }

    .note-card p {
        color: #4a5568;
        margin: 0;
        white-space: pre-wrap;
    }

    .timeline {
        position: relative;
        padding-left: 2rem;
    }

    .timeline::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e2e8f0;
    }

    .timeline-item {
        position: relative;
        padding-bottom: 2rem;
    }

    .timeline-marker {
        position: absolute;
        left: -2.5rem;
        width: 2rem;
        height: 2rem;
        background: white;
        border: 2px solid #4c1d95;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4c1d95;
    }

    .timeline-content {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .timeline-content h3 {
        font-size: 1.125rem;
        color: #2d3748;
        margin: 0 0 0.5rem 0;
    }

    .timeline-content p {
        color: #4a5568;
        margin: 0;
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

    button:hover {
        opacity: 0.9;
    }

    @media (max-width: 768px) {
        .project-page {
            padding: 1rem;
        }

        .info-grid,
        .notes-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
