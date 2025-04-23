<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column } from '$lib/components/DatabaseTable/types';
    import NewProjectModal from '../../routes/projects/NewProjectModal.svelte';
    import ProjectMilestones from '../../routes/projects/ProjectMilestones.svelte';

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
        description?: string;
        impact_statement?: string;
        target_audience?: string;
    }

    let activeProjects: Project[] = [];
    let mentorToLaunchProjects: Project[] = [];
    let proBonoProjects: Project[] = [];
    let loading = true;
    let error = '';
    let showNewProjectModal = false;
    let selectedProjectType: 'active' | 'mentor' | 'probono' = 'active';

    const projectTypes = [
        { id: 'active', label: 'Active Projects', description: 'Web-based app development projects' },
        { id: 'mentor', label: 'Mentor To Launch', description: 'Small trades business launch projects' },
        { id: 'probono', label: 'Pro Bono', description: 'Non-profit and social impact projects' }
    ];

    // ... (Copy activeColumns, mentorColumns, proBonoColumns, configs from projects/+page.svelte)
    // For brevity, I'll include the configs for all three tables here.

    const activeProjectsConfig = {
        tableName: 'active_projects',
        columns: [
            { id: 'company_name', label: 'Company Name', type: 'text', required: true },
            { id: 'partner_name', label: 'Partner', type: 'text' },
            { id: 'industry', label: 'Industry', type: 'text' },
            { id: 'ownership', label: 'Ownership %', type: 'number' },
            { id: 'development_revenue', label: 'Dev Revenue', type: 'text' },
            { id: 'website', label: 'Website', type: 'text' }
        ],
        features: { add: true, edit: true, delete: true, search: true, filter: true, sort: true, pagination: true },
        permissions: {
            canEdit: (row: any) => true,
            canDelete: (row: any) => true
        }
    };

    const mentorToLaunchConfig = {
        tableName: 'mentor_to_launch_projects',
        columns: [
            { id: 'company_name', label: 'Company Name', type: 'text', required: true },
            { id: 'partner_name', label: 'Partner', type: 'text' },
            { id: 'industry', label: 'Industry', type: 'text' },
            { id: 'ownership', label: 'Ownership %', type: 'number' },
            { id: 'development_revenue', label: 'Dev Revenue', type: 'text' },
            { id: 'website', label: 'Website', type: 'text' }
        ],
        features: { add: true, edit: true, delete: true, search: true, filter: true, sort: true, pagination: true },
        permissions: {
            canEdit: (row: any) => true,
            canDelete: (row: any) => true
        }
    };

    const proBonoConfig = {
        tableName: 'pro_bono_projects',
        columns: [
            { id: 'company_name', label: 'Company Name', type: 'text', required: true },
            { id: 'partner_name', label: 'Partner', type: 'text' },
            { id: 'industry', label: 'Industry', type: 'text' },
            { id: 'ownership', label: 'Ownership %', type: 'number' },
            { id: 'development_revenue', label: 'Dev Revenue', type: 'text' },
            { id: 'website', label: 'Website', type: 'text' }
        ],
        features: { add: true, edit: true, delete: true, search: true, filter: true, sort: true, pagination: true },
        permissions: {
            canEdit: (row: any) => true,
            canDelete: (row: any) => true
        }
    };

    async function loadProjects() {
        loading = true;
        try {
            const [active, mentor, probono] = await Promise.all([
                supabase.from('active_projects').select('*').order('created_at', { ascending: false }),
                supabase.from('mentor_to_launch_projects').select('*').order('created_at', { ascending: false }),
                supabase.from('pro_bono_projects').select('*').order('created_at', { ascending: false })
            ]);
            activeProjects = active.data || [];
            mentorToLaunchProjects = mentor.data || [];
            proBonoProjects = probono.data || [];
        } catch (err: any) {
            error = err.message;
        }
        loading = false;
    }

    onMount(loadProjects);
</script>

<div class="projects-dashboard">
    <h2 class="text-2xl font-bold mb-4">Projects</h2>
    {#each projectTypes as projectType}
        <section class="mb-8">
            <div class="project-card">
                <div class="section-header">
                    <h3>{projectType.label}</h3>
                    <p class="section-description">{projectType.description}</p>
                    <button class="add-project-btn" on:click={() => { selectedProjectType = projectType.id; showNewProjectModal = true; }}>
                        <i class="fas fa-plus"></i> Add Project
                    </button>
                </div>
                <div class="table-container">
                    {#if projectType.id === 'active'}
                        <DatabaseTable config={activeProjectsConfig} supabase={supabase} initialData={activeProjects} onDataChange={(data) => activeProjects = data} />
                    {:else if projectType.id === 'mentor'}
                        <DatabaseTable config={mentorToLaunchConfig} supabase={supabase} initialData={mentorToLaunchProjects} onDataChange={(data) => mentorToLaunchProjects = data} />
                    {:else if projectType.id === 'probono'}
                        <DatabaseTable config={proBonoConfig} supabase={supabase} initialData={proBonoProjects} onDataChange={(data) => proBonoProjects = data} />
                    {/if}
                </div>
            </div>
        </section>
    {/each}
    <NewProjectModal show={showNewProjectModal} projectType={selectedProjectType} on:projectAdded={loadProjects} on:close={() => showNewProjectModal = false} />
</div>

<style>
.projects-dashboard {
    background: var(--card-bg);
    color: var(--foreground);
    border-radius: 1rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1.5px 4px rgba(0,0,0,0.03);
    padding: 2rem;
    margin-top: 2rem;
}
.project-card {
    margin-bottom: 2rem;
    background: var(--card-bg-alt);
    color: var(--foreground);
    border-radius: 1rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    padding: 2rem 2rem 1.5rem 2rem;
}
.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}
.section-description {
    color: var(--text-2);
    font-size: 1rem;
}
.add-project-btn {
    background: var(--primary, #2563eb);
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.2s;
}
.add-project-btn:hover {
    background: var(--primary-hover, #1d4ed8);
}
.add-project-btn i {
    margin-right: 0.5rem;
}
.table-container {
    margin-top: 1rem;
}
</style>
