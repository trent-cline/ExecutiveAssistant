<script lang="ts">
    import ProjectsDashboard from '$lib/components/ProjectsDashboard.svelte';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import NewProjectModal from './NewProjectModal.svelte';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    let showNewProjectModal = false;
    let loading = false;
    let error = null;
    let activeProjects = [];
    let mentorToLaunchProjects = [];
    let proBonoProjects = [];
    let selectedProjectType: 'active' | 'mentor' | 'probono' = 'active';
    // Define project types for section rendering and selection
    const projectTypes = [
        {
            id: 'active',
            label: 'Active Projects',
            description: 'All currently active projects.'
        },
        {
            id: 'mentor',
            label: 'Mentor To Launch',
            description: 'Projects in the mentor-to-launch pipeline.'
        },
        {
            id: 'probono',
            label: 'Pro Bono',
            description: 'Pro bono and social impact projects.'
        }
    ];

    const activeProjectsConfig = {
        tableName: 'active_projects',
        columns: [
            {
                id: 'company_name',
                label: 'Company',
                type: 'text',
                template: (value, row) => row && row.id ? `
                    <a href="/projects/${row.id}" class="company-link">${value || ''}</a>
                ` : value || ''
            },
            {
                id: 'partner_name',
                label: 'Partner',
                type: 'text'
            },
            {
                id: 'industry',
                label: 'Industry',
                type: 'text'
            },
            {
                id: 'website',
                label: 'Website',
                type: 'url',
                template: (value) => value ? `
                    <button class="website-button" onclick="window.open('${value}', '_blank')">
                        <i class="fas fa-arrow-up-right-from-square"></i>
                    </button>
                ` : '<span class="no-website">-</span>'
            },
            {
                id: 'milestones',
                label: 'Milestones',
                type: 'milestones'
            },
            {
                id: 'ownership',
                label: 'Ownership %',
                type: 'percentage'
            },
            {
                id: 'development_revenue',
                label: 'Dev Revenue',
                type: 'currency'
            }
        ],
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            edit: true,
            delete: true
        },
        permissions: {
            canEdit: (row) => true,
            canDelete: (row) => true
        },
        actions: [
            {
                icon: 'pen-to-square',
                label: 'Edit',
                handler: (row) => handleProjectEdit(row)
            },
            {
                icon: 'arrow-down',
                label: 'Move to Mentor',
                handler: (row) => moveProject(row.id, 'active_projects', 'mentor_to_launch_projects')
            },
            {
                icon: 'chart-line',
                label: 'Analytics',
                handler: (row) => showAnalytics(row)
            },
            {
                icon: 'trash-can',
                label: 'Delete',
                handler: (row) => handleProjectDelete(row.id, 'active')
            }
        ]
        }

    async function handleProjectDelete(projectId: string, type: 'active' | 'mentor' | 'probono') {
        let tableName = '';
        if (type === 'active') tableName = 'active_projects';
        else if (type === 'mentor') tableName = 'mentor_to_launch_projects';
        else if (type === 'probono') tableName = 'pro_bono_projects';
        try {
            loading = true;
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', projectId);
            if (deleteError) throw deleteError;
            await loadProjects();
        } catch (err) {
            console.error('Error deleting project:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    const mentorToLaunchConfig = {
        tableName: 'mentor_to_launch_projects',
        columns: [
            {
                id: 'company_name',
                label: 'Business',
                type: 'text',
                template: (value, row) => row && row.id ? `
                    <a href="/projects/${row.id}" class="company-link">${value || ''}</a>
                ` : value || ''
            },
            {
                id: 'website',
                label: 'Website',
                type: 'url',
                template: (value) => value ? `
                    <a href="${value}" target="_blank" rel="noopener noreferrer" class="website-link">
                        <i class="fas fa-arrow-up-right-from-square"></i>
                    </a>
                ` : '<span class="no-website">-</span>'
            },
            {
                id: 'owner_name',
                label: 'Owner',
                type: 'text'
            },
            {
                id: 'industry',
                label: 'Industry',
                type: 'text'
            },
            {
                id: 'revenue_model',
                label: 'Revenue Model',
                type: 'text'
            },
            {
                id: 'launch_status',
                label: 'Status',
                type: 'select',
                filterOptions: ['Planning', 'Building', 'Marketing', 'Operating'],
                template: (value) => {
                    const colors = {
                        'Planning': '#6c757d',
                        'Building': '#007bff',
                        'Marketing': '#ffc107',
                        'Operating': '#28a745'
                    };
                    return `<span class="status-badge" style="background-color: ${colors[value]}">${value}</span>`;
                }
            },
            {
                id: 'milestones',
                label: 'Milestones',
                type: 'milestones'
            }
        ],
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            edit: true,
            delete: true
        },
        permissions: {
            canEdit: (row) => true,
            canDelete: (row) => true
        },
        actions: [
            {
                icon: 'pen-to-square',
                label: 'Edit',
                handler: (row) => handleProjectEdit(row)
            },
            {
                icon: 'arrow-up',
                label: 'Move to Active',
                handler: (row) => moveProject(row.id, 'mentor_to_launch_projects', 'active_projects')
            },
            {
                icon: 'chart-line',
                label: 'Analytics',
                handler: (row) => showAnalytics(row)
            },
            {
                icon: 'trash-can',
                label: 'Delete',
                handler: (row) => handleProjectDelete(row.id, 'mentor')
            }
        ],
        pageSize: 10
    };

    const proBonoConfig = {
        tableName: 'pro_bono_projects',
        columns: [
            {
                id: 'company_name',
                label: 'Organization',
                width: '200px',
                sortable: true,
                template: (value, row) => row && row.id ? `
                    <a href="/projects/${row.id}" class="company-link">${value || ''}</a>
                ` : value || ''
            },
            {
                id: 'partner_name',
                label: 'Contact',
                width: '150px',
                sortable: true
            },
            {
                id: 'industry',
                label: 'Focus Area',
                width: '150px',
                sortable: true
            },
            {
                id: 'target_audience',
                label: 'Target Audience',
                width: '150px',
                sortable: true
            },
            {
                id: 'status',
                label: 'Status',
                width: '120px',
                sortable: true,
                template: (value) => `<span class="status-badge ${value?.toLowerCase()}">${value || ''}</span>`
            },
            {
                id: 'website',
                label: 'Website',
                width: '100px',
                template: (value) => value ? `
                    <a href="${value}" target="_blank" rel="noopener noreferrer" class="website-link">
                        <i class="fas fa-arrow-up-right-from-square"></i>
                    </a>
                ` : '<span class="no-website">-</span>'
            },
            {
                id: 'milestones',
                label: 'Milestones',
                type: 'milestones',
                width: '200px'
            }
        ],
        features: {
            add: true,
            edit: true,
            delete: true,
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            select: true
        },
        permissions: {
            canEdit: (row: any) => true,
            canDelete: (row: any) => true
        }
    };

    async function loadProjects() {
        if (!$user) {
            goto('/login');
            return;
        }

        try {
            loading = true;
            error = null;

            // Load active projects
            const { data: activeData, error: activeError } = await supabase
                .from('active_projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (activeError) throw activeError;
            activeProjects = activeData;

            // Load mentor to launch projects
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentor_to_launch_projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (mentorError) throw mentorError;
            mentorToLaunchProjects = mentorData;

            // Load pro bono projects
            const { data: proBonoData, error: proBonoError } = await supabase
                .from('pro_bono_projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (proBonoError) throw proBonoError;
            proBonoProjects = proBonoData;

        } catch (err) {
            console.error('Error loading projects:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function handleProjectAdded() {
        await loadProjects();
        showNewProjectModal = false;
    }

    async function handleDataChange(newData: any[]) {
        // Ensure we're working with a fresh copy of the data
        const updatedData = [...newData];
        
        switch (selectedProjectType) {
            case 'active':
                activeProjects = updatedData;
                break;
            case 'mentor':
                mentorToLaunchProjects = updatedData;
                break;
            case 'probono':
                proBonoProjects = updatedData;
                break;
        }
    }

    function handleProjectEdit(event: CustomEvent) {
        const { row } = event.detail;
        handleDataChange(
            selectedProjectType === 'active' ? activeProjects : 
            selectedProjectType === 'mentor' ? mentorToLaunchProjects : 
            proBonoProjects
        );
    }

    async function moveProject(projectId: string, fromTable: string, targetTable: string) {
        try {
            // Get project data
            const { data: projectData, error: fetchError } = await supabase
                .from(fromTable)
                .select('*')
                .eq('id', projectId)
                .single();

            if (fetchError) throw fetchError;

            // Insert into target table
            const { error: insertError } = await supabase
                .from(targetTable)
                .insert([projectData]);

            if (insertError) throw insertError;

            // Delete from original table
            const { error: deleteError } = await supabase
                .from(fromTable)
                .delete()
                .eq('id', projectId);

            if (deleteError) throw deleteError;

            // Refresh data
            await loadProjects();
        } catch (err) {
            console.error('Error moving project:', err);
            error = err.message;
        }
    }

    async function showAnalytics(row) {
        // TODO: Implement analytics view
        console.log('Show analytics for:', row);
    }

    onMount(loadProjects);

    // Initialize window.moveProject for the template
    if (typeof window !== 'undefined') {
        window.moveProject = async (projectId: string) => {
            const fromTable = 'active_projects';
            const targetTable = 'mentor_to_launch_projects';
            await moveProject(projectId, fromTable, targetTable);
        };
    }

    function handleAddProject(type: 'active' | 'mentor' | 'probono') {
        selectedProjectType = type;
        showNewProjectModal = true;
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
                        onDataChange={(data) => handleDataChange(data)}
                        on:edit={handleProjectEdit}
                    />
                {:else if projectType.id === 'mentor'}
                    <DatabaseTable
                        config={mentorToLaunchConfig}
                        {supabase}
                        initialData={mentorToLaunchProjects}
                        onDataChange={(data) => handleDataChange(data)}
                        on:edit={handleProjectEdit}
                    />
                {:else if projectType.id === 'probono'}
                    <DatabaseTable
                        config={proBonoConfig}
                        {supabase}
                        initialData={proBonoProjects}
                        onDataChange={(data) => handleDataChange(data)}
                        on:edit={handleProjectEdit}
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

    :global(.website-button) {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: #4c1d95;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
    }

    :global(.website-button:hover) {
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

    :global(.status-badge) {
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        color: white;
        font-size: 0.875rem;
        white-space: nowrap;
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
