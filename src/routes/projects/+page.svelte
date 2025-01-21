<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import DataTable from '$lib/components/DataTable/DataTable.svelte';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column } from '$lib/components/DataTable/types';
    import NewProjectModal from './NewProjectModal.svelte';
    import ProjectMilestones from './ProjectMilestones.svelte';

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
    }

    let activeProjects: Project[] = [];
    let staticWebsiteProjects: Project[] = [];
    let mentorToLaunchProjects: Project[] = [];
    let loading = true;
    let error = '';
    let showNewProjectModal = false;
    let selectedProjectType: 'active' | 'static' | 'mentor' = 'active';

    const projectTypes = [
        { id: 'active', label: 'Active Projects', description: 'Web-based app development projects' },
        { id: 'static', label: 'Static Websites', description: 'Static website development projects' },
        { id: 'mentor', label: 'Mentor To Launch', description: 'Small trades business launch projects' }
    ];

    const activeColumns: Column[] = [
        {
            id: 'company_name',
            label: 'Company',
            width: '200px',
            sortable: true,
            template: (value, row) => row && row.id ? `
                <a href="/projects/${row.id}" class="company-link">${value || ''}</a>
            ` : value || ''
        },
        {
            id: 'partner_name',
            label: 'Partner',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        {
            id: 'industry',
            label: 'Industry',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        {
            id: 'ownership',
            label: 'Ownership %',
            width: '120px',
            sortable: true,
            template: (value) => value ? `${value}%` : ''
        },
        {
            id: 'development_revenue',
            label: 'Dev Revenue',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        {
            id: 'additional_revenue',
            label: 'Additional Revenue',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        {
            id: 'status',
            label: 'Status',
            width: '120px',
            filterOptions: ['Active', 'On Hold', 'Completed'],
            template: (value) => {
                if (!value) return '';
                const colors = {
                    'Active': '#28a745',
                    'On Hold': '#ffc107',
                    'Completed': '#6c757d'
                };
                return `<span style="color: ${colors[value] || '#6c757d'}">${value}</span>`;
            }
        },
        {
            id: 'website',
            label: 'Website',
            width: '150px',
            template: (value) => value ? `
                <a href="${value}" target="_blank" rel="noopener noreferrer" class="website-link">
                    <i class="fas fa-external-link-alt"></i> Visit
                </a>
            ` : '<span class="no-website">-</span>'
        },
        {
            id: 'milestones',
            label: 'Milestones',
            width: '150px',
            template: (value, row) => `
                <ProjectMilestones 
                    milestones={{
                        industry_identified: row.industry_identified || false,
                        partner_ided: row.partner_ided || false,
                        prototype_created: row.prototype_created || false,
                        deal_signed: row.deal_signed || false
                    }}
                    on:change={async (e) => {
                        try {
                            const { error } = await supabase
                                .from('active_projects')
                                .update({
                                    industry_identified: e.detail.milestones.industry_identified,
                                    partner_ided: e.detail.milestones.partner_ided,
                                    prototype_created: e.detail.milestones.prototype_created,
                                    deal_signed: e.detail.milestones.deal_signed
                                })
                                .eq('id', row.id);
                            
                            if (error) throw error;
                        } catch (err) {
                            console.error('Error updating project milestones:', err);
                        }
                    }}
                />
            `
        },
        {
            id: 'actions',
            label: 'Actions',
            width: '200px',
            template: (_, row) => `
                <div class="action-buttons">
                    ${row.website ? `
                        <a href="${row.website}" target="_blank" rel="noopener noreferrer" class="website-link">
                            <i class="fas fa-external-link-alt"></i> Website
                        </a>
                    ` : ''}
                    <button onclick="window.moveProject('${row.id}')" class="move-button">
                        <i class="fas fa-exchange-alt"></i> Move
                    </button>
                </div>
            `
        }
    ];

    const mentorColumns: Column[] = [
        { 
            id: 'company_name',
            label: 'Company',
            width: '200px',
            sortable: true,
            template: (value, row) => row && row.id ? `
                <a href="/projects/mentor/${row.id}" class="company-link">${value || ''}</a>
            ` : value || ''
        },
        { 
            id: 'partner_name',
            label: 'Partner',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        { 
            id: 'industry',
            label: 'Industry',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        {
            id: 'website',
            label: 'Website',
            width: '150px',
            template: (value) => value ? `
                <a href="${value}" target="_blank" rel="noopener noreferrer" class="website-link">
                    <i class="fas fa-external-link-alt"></i> Visit
                </a>
            ` : '<span class="no-website">-</span>'
        },
        {
            id: 'status',
            label: 'Status',
            width: '120px',
            template: (value) => `<span class="status status-${value.toLowerCase()}">${value}</span>`
        },
        {
            id: 'actions',
            label: 'Actions',
            width: '150px',
            template: (_, row) => `
                <div class="actions">
                    <a href="/projects/${row.id}" class="view-link">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="move-btn" data-id="${row.id}">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                </div>
            `
        }
    ];

    const staticColumns: Column[] = [
        { 
            id: 'company_name',
            label: 'Company',
            width: '200px',
            sortable: true,
            template: (value, row) => row && row.id ? `
                <a href="/projects/static/${row.id}" class="company-link">${value || ''}</a>
            ` : value || ''
        },
        { 
            id: 'partner_name',
            label: 'Partner',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        { 
            id: 'industry',
            label: 'Industry',
            width: '150px',
            sortable: true,
            template: (value) => value || ''
        },
        {
            id: 'website',
            label: 'Website',
            width: '150px',
            template: (value) => value ? `
                <a href="${value}" target="_blank" rel="noopener noreferrer" class="website-link">
                    <i class="fas fa-external-link-alt"></i> Visit
                </a>
            ` : '<span class="no-website">-</span>'
        },
        {
            id: 'status',
            label: 'Status',
            width: '120px',
            template: (value) => `<span class="status status-${value.toLowerCase()}">${value}</span>`
        },
        {
            id: 'actions',
            label: 'Actions',
            width: '150px',
            template: (_, row) => `
                <div class="actions">
                    <a href="/projects/${row.id}" class="view-link">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="move-btn" data-id="${row.id}">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                </div>
            `
        }
    ];

    const staticWebsiteConfig = {
        tableName: 'static_website_projects',
        columns: [
            {
                id: 'company_name',
                label: 'Company',
                width: '200px',
                sortable: true,
                required: true,
                type: 'text',
                template: (value, row) => row && row.id ? `
                    <a href="/projects/static/${row.id}" class="company-link">${value || ''}</a>
                ` : value || ''
            },
            {
                id: 'partner_name',
                label: 'Partner',
                width: '150px',
                sortable: true,
                required: true
            },
            {
                id: 'industry',
                label: 'Industry',
                width: '150px',
                sortable: true,
                filterable: true
            },
            {
                id: 'hosting_provider',
                label: 'Hosting',
                width: '150px',
                sortable: true,
                filterable: true
            },
            {
                id: 'domain_provider',
                label: 'Domain',
                width: '150px',
                sortable: true
            },
            {
                id: 'monthly_cost',
                label: 'Monthly Cost',
                width: '120px',
                sortable: true,
                type: 'currency'
            },
            {
                id: 'website',
                label: 'Website',
                width: '150px',
                type: 'url'
            },
            {
                id: 'status',
                label: 'Status',
                width: '120px',
                type: 'select',
                filterable: true,
                filterOptions: ['Active', 'On Hold', 'Completed']
            }
        ],
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            add: true,
            edit: true,
            delete: true,
            export: true
        },
        permissions: {
            canAdd: true,
            canEdit: (row) => true,
            canDelete: (row) => true
        },
        pageSize: 10
    };

    const activeProjectsConfig = {
        tableName: 'active_projects',
        columns: [
            {
                id: 'company_name',
                label: 'Company',
                width: '200px',
                sortable: true,
                required: true,
                type: 'text'
            },
            {
                id: 'partner_name',
                label: 'Partner',
                width: '150px',
                sortable: true,
                required: true,
                type: 'text'
            },
            {
                id: 'industry',
                label: 'Industry',
                width: '150px',
                sortable: true,
                filterable: true,
                type: 'text'
            },
            {
                id: 'ownership',
                label: 'Ownership %',
                width: '120px',
                sortable: true,
                type: 'percentage'
            },
            {
                id: 'development_revenue',
                label: 'Dev Revenue',
                width: '150px',
                sortable: true,
                type: 'currency'
            },
            {
                id: 'additional_revenue',
                label: 'Additional Revenue',
                width: '150px',
                sortable: true,
                type: 'currency'
            },
            {
                id: 'website',
                label: 'Website',
                width: '150px',
                type: 'url'
            },
            {
                id: 'status',
                label: 'Status',
                width: '120px',
                type: 'select',
                filterable: true,
                filterOptions: ['Active', 'On Hold', 'Completed'],
                template: (value) => {
                    if (!value) return '';
                    const colors = {
                        'Active': '#28a745',
                        'On Hold': '#ffc107',
                        'Completed': '#6c757d'
                    };
                    return `<span style="color: ${colors[value] || '#6c757d'}">${value}</span>`;
                }
            },
            {
                id: 'milestones',
                label: 'Milestones',
                width: '200px',
                type: 'milestones'
            }
        ],
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            add: true,
            edit: true,
            delete: true,
            export: true
        },
        permissions: {
            canAdd: true,
            canEdit: (row) => true,
            canDelete: (row) => true
        },
        pageSize: 10,
        customActions: [
            {
                name: 'move',
                label: 'Move Project',
                icon: 'arrows-alt',
                handler: (row) => moveProject(row.id, 'active_projects', 'static_website_projects')
            }
        ]
    };

    async function loadProjects() {
        if (!$user) {
            goto('/login');
            return;
        }
        
        try {
            loading = true;
            const [activeRes, staticRes, mentorRes] = await Promise.all([
                supabase.from('active_projects').select('*'),
                supabase.from('static_website_projects').select('*'),
                supabase.from('mentor_to_launch_projects').select('*')
            ]);

            if (activeRes.error) throw activeRes.error;
            if (staticRes.error) throw staticRes.error;
            if (mentorRes.error) throw mentorRes.error;

            activeProjects = activeRes.data || [];
            staticWebsiteProjects = staticRes.data || [];
            mentorToLaunchProjects = mentorRes.data || [];
            loading = false;
        } catch (err) {
            console.error('Error loading projects:', err);
            error = err.message;
            loading = false;
        }
    }

    onMount(loadProjects);

    async function moveProject(projectId: string, fromTable: string, toTable: string) {
        try {
            // Get the project data
            const { data: project, error: fetchError } = await supabase
                .from(fromTable)
                .select('*')
                .eq('id', projectId)
                .single();

            if (fetchError) throw fetchError;

            // Insert into new table
            const { error: insertError } = await supabase
                .from(toTable)
                .insert([{
                    ...project,
                    id: undefined, // Let the new table generate a new ID
                    user_id: $user?.id // Set the user_id
                }]);

            if (insertError) throw insertError;

            // Delete from old table
            const { error: deleteError } = await supabase
                .from(fromTable)
                .delete()
                .eq('id', projectId);

            if (deleteError) throw deleteError;

            // Reload projects
            await loadProjects();
        } catch (e) {
            console.error('Error moving project:', e);
            error = e.message;
        }
    }

    // Initialize window.moveProject for the template
    if (typeof window !== 'undefined') {
        window.moveProject = async (projectId: string) => {
            const fromTable = 'active_projects';
            
            const targetTable = await new Promise<string>((resolve) => {
                const options = projectTypes
                    .filter(type => type.id !== 'active')
                    .map(type => ({
                        label: type.label,
                        value: type.id === 'static' ? 'static_website_projects' :
                               'mentor_to_launch_projects'
                    }));

                // Create a simple modal for selection
                const modal = document.createElement('div');
                modal.className = 'move-modal';
                modal.innerHTML = `
                    <div class="move-modal-content">
                        <h3>Move Project To:</h3>
                        ${options.map(opt => `
                            <button onclick="document.querySelector('.move-modal').dataset.selected='${opt.value}'">
                                ${opt.label}
                            </button>
                        `).join('')}
                    </div>
                `;
                document.body.appendChild(modal);

                modal.addEventListener('click', (e) => {
                    const selected = modal.dataset.selected;
                    if (selected) {
                        modal.remove();
                        resolve(selected);
                    }
                });
            });

            if (targetTable) {
                await moveProject(projectId, fromTable, targetTable);
            }
        };
    }

    function handleAddProject(type: 'active' | 'static' | 'mentor') {
        selectedProjectType = type;
        showNewProjectModal = true;
    }

    async function handleProjectAdded() {
        await loadProjects();
    }
</script>

<div class="projects-page">
    <div class="header">
        <h1>Projects</h1>
    </div>

    {#if loading}
        <div class="loading">Loading projects...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else}
        {#each projectTypes as projectType}
            <section class="project-section">
                <div class="section-header">
                    <h2>{projectType.label}</h2>
                    <p class="section-description">{projectType.description}</p>
                    <button class="add-project-btn" on:click={() => handleAddProject(projectType.id)}>
                        <i class="fas fa-plus"></i> Add Project
                    </button>
                </div>

                {#if projectType.id === 'active'}
                    <DatabaseTable
                        config={activeProjectsConfig}
                        {supabase}
                        initialData={activeProjects}
                        onDataChange={(data) => activeProjects = data}
                    />
                {:else if projectType.id === 'static'}
                    <DatabaseTable
                        config={staticWebsiteConfig}
                        {supabase}
                        initialData={staticWebsiteProjects}
                        onDataChange={(data) => staticWebsiteProjects = data}
                    />
                {:else if projectType.id === 'mentor'}
                    <DataTable 
                        data={mentorToLaunchProjects}
                        columns={mentorColumns}
                        sortable={true}
                        searchable={true}
                    />
                {/if}
            </section>
        {/each}
    {/if}
</div>

<NewProjectModal
    bind:show={showNewProjectModal}
    projectType={selectedProjectType}
    on:projectAdded={handleProjectAdded}
    on:close={() => showNewProjectModal = false}
/>

<style>
    .projects-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        margin-bottom: 2rem;
    }

    h1 {
        font-size: 2rem;
        color: #1a202c;
        margin: 0;
    }

    .project-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }

    h2 {
        font-size: 1.5rem;
        color: #2d3748;
        margin: 0;
    }

    .section-description {
        color: #718096;
        margin: 0;
        flex: 1;
    }

    .add-project-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #4c1d95;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .add-project-btn:hover {
        background: #6d28d9;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #4a5568;
    }

    .error {
        text-align: center;
        padding: 2rem;
        color: #e53e3e;
    }

    :global(.company-link) {
        color: #4c1d95;
        text-decoration: none;
        font-weight: 500;
    }

    :global(.company-link:hover) {
        text-decoration: underline;
    }

    :global(.website-link) {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        background: #4c1d95;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 0.75rem;
    }

    :global(.website-link:hover) {
        background: #6d28d9;
    }

    :global(.no-website) {
        color: #a0aec0;
    }

    :global(.status) {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    :global(.status-active) {
        background: #c6f6d5;
        color: #22543d;
    }

    :global(.status-on-hold) {
        background: #feebc8;
        color: #744210;
    }

    :global(.status-completed) {
        background: #e2e8f0;
        color: #2d3748;
    }

    @media (max-width: 768px) {
        .projects-page {
            padding: 1rem;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
    }
</style>
