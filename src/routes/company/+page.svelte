<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column } from '$lib/components/DatabaseTable/types';
    import NewProjectModal from '../projects/NewProjectModal.svelte';
    import { goto } from '$app/navigation';

    let activeProjects = [];
    let mentorToLaunchProjects = [];
    let proBonoProjects = [];
    let loading = true;
    let error: string | null = null;
    let showNewProjectModal = false;
    let selectedProjectType = 'active';

    const projectTypes = [
        { id: 'active', label: 'Active Projects', description: 'Web-based app development projects' },
        { id: 'mentor', label: 'Mentor To Launch', description: 'Small trades business launch projects' },
        { id: 'probono', label: 'Pro Bono', description: 'Non-profit and social impact projects' }
    ];

    // Table configs (copy structure from projects page)
    const activeProjectsConfig = {
        tableName: 'active_projects',
        columns: [
            { id: 'company_name', label: 'Company', type: 'text', template: (value, row) => row && row.id ? `<a href="/projects/${row.id}" class="company-link">${value || ''}</a>` : value || '' },
            { id: 'partner_name', label: 'Partner', type: 'text' },
            { id: 'industry', label: 'Industry', type: 'text' },
            { id: 'website', label: 'Website', type: 'url', template: (value) => value ? `<button class="website-button" onclick="window.open('${value}', '_blank')"><i class="fas fa-arrow-up-right-from-square"></i></button>` : '<span class="no-website">-</span>' },
            { id: 'ownership', label: 'Ownership %', type: 'percentage' },
            { id: 'development_revenue', label: 'Dev Revenue', type: 'currency' }
        ],
        features: { search: true, filter: true, sort: true, pagination: true, edit: true, delete: true },
        permissions: { canEdit: (row) => true, canDelete: (row) => true },
        actions: [
            { icon: 'pen-to-square', label: 'Edit', handler: (row) => handleProjectEdit(row) },
            { icon: 'arrow-down', label: 'Move to Mentor', handler: (row) => moveProject(row.id, 'active_projects', 'mentor_to_launch_projects') },
            { icon: 'chart-line', label: 'Analytics', handler: (row) => showAnalytics(row) },
            { icon: 'trash-can', label: 'Delete', handler: (row) => handleProjectDelete(row.id, 'active') }
        ]
    };
    const mentorToLaunchConfig = {
        tableName: 'mentor_to_launch_projects',
        columns: [
            { id: 'company_name', label: 'Business', type: 'text', template: (value, row) => row && row.id ? `<a href="/projects/${row.id}" class="company-link">${value || ''}</a>` : value || '' },
            { id: 'website', label: 'Website', type: 'url', template: (value) => value ? `<a href="${value}" target="_blank" rel="noopener noreferrer" class="website-link"><i class="fas fa-arrow-up-right-from-square"></i></a>` : '<span class="no-website">-</span>' },
            { id: 'owner_name', label: 'Owner', type: 'text' },
            { id: 'industry', label: 'Industry', type: 'text' },
            { id: 'status', label: 'Status', type: 'text', template: (value) => `<span class="status status-${value?.toLowerCase?.()}">${value}</span>` }
        ],
        features: { search: true, filter: true, sort: true, pagination: true, edit: true, delete: true },
        permissions: { canEdit: (row) => true, canDelete: (row) => true },
        actions: [
            { icon: 'pen-to-square', label: 'Edit', handler: (row) => handleProjectEdit(row) },
            { icon: 'arrow-up', label: 'Move to Active', handler: (row) => moveProject(row.id, 'mentor_to_launch_projects', 'active_projects') },
            { icon: 'trash-can', label: 'Delete', handler: (row) => handleProjectDelete(row.id, 'mentor') }
        ]
    };
    const proBonoConfig = {
        tableName: 'pro_bono_projects',
        columns: [
            { id: 'company_name', label: 'Organization', type: 'text', template: (value, row) => row && row.id ? `<a href="/projects/${row.id}" class="company-link">${value || ''}</a>` : value || '' },
            { id: 'industry', label: 'Industry', type: 'text' },
            { id: 'website', label: 'Website', type: 'url', template: (value) => value ? `<a href="${value}" target="_blank" rel="noopener noreferrer" class="website-link"><i class="fas fa-arrow-up-right-from-square"></i></a>` : '<span class="no-website">-</span>' },
            { id: 'status', label: 'Status', type: 'text', template: (value) => `<span class="status status-${value?.toLowerCase?.()}">${value}</span>` }
        ],
        features: { search: true, filter: true, sort: true, pagination: true, edit: true, delete: true },
        permissions: { canEdit: (row) => true, canDelete: (row) => true },
        actions: [
            { icon: 'pen-to-square', label: 'Edit', handler: (row) => handleProjectEdit(row) },
            { icon: 'trash-can', label: 'Delete', handler: (row) => handleProjectDelete(row.id, 'probono') }
        ]
    };

    function handleProjectEdit(row) {
        // TODO: Implement edit modal if needed
        // For now, just reload
        loadProjects();
    }

    function handleProjectDelete(id, type) {
        // TODO: Implement delete logic if needed
        loadProjects();
    }

    async function moveProject(projectId: string, fromTable: string, targetTable: string) {
        try {
            const { data: projectData, error: fetchError } = await supabase
                .from(fromTable)
                .select('*')
                .eq('id', projectId)
                .single();
            if (fetchError) throw fetchError;
            const { error: insertError } = await supabase
                .from(targetTable)
                .insert([projectData]);
            if (insertError) throw insertError;
            const { error: deleteError } = await supabase
                .from(fromTable)
                .delete()
                .eq('id', projectId);
            if (deleteError) throw deleteError;
            await loadProjects();
        } catch (err) {
            error = err.message;
        }
    }

    async function showAnalytics(row) {
        // TODO: Implement analytics view
        console.log('Show analytics for:', row);
    }

    function handleAddProject(type) {
        selectedProjectType = type;
        showNewProjectModal = true;
    }

    function handleProjectAdded() {
        showNewProjectModal = false;
        loadProjects();
    }

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
        } catch (err) {
            error = err.message;
        }
        loading = false;
    }

    onMount(async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
            goto('/login');
            return;
        }
        await loadProjects();
    });
</script>

<svelte:head>
    <title>Pillar Apps - Company Dashboard</title>
</svelte:head>

<div class="page-container">
    <div class="content">
        <!-- Header Section -->
        <div class="header">
            <div class="header-content">
                <h1>Pillar Apps, LLC</h1>
                <p>Financial Dashboard & Funding Management</p>
            </div>

        </div>

        <!-- Main Grid Layout -->
        <div class="main-grid">
            <!-- Main Content -->
            <div class="main-content">
                <!-- Project Tables (all types) -->
                {#if loading}
                    <div class="loading">Loading projects...</div>
                {:else if error}
                    <div class="error">{error}</div>
                {:else}
                    {#each projectTypes as projectType}
    <section class="project-section">
        <div class="project-card">
            <div class="section-header">
                <h2>{projectType.label}</h2>
                <p class="section-description">{projectType.description}</p>
                <button class="add-project-btn" on:click={() => handleAddProject(projectType.id)}>
                    <i class="fas fa-plus"></i> Add Project
                </button>
            </div>
            <div class="table-container">
                {#if projectType.id === 'active'}
                    <DatabaseTable
                        config={activeProjectsConfig}
                        supabase={supabase}
                        initialData={activeProjects}
                        onDataChange={(data) => activeProjects = data}
                    />
                {:else if projectType.id === 'mentor'}
                    <DatabaseTable
                        config={mentorToLaunchConfig}
                        supabase={supabase}
                        initialData={mentorToLaunchProjects}
                        onDataChange={(data) => mentorToLaunchProjects = data}
                    />
                {:else if projectType.id === 'probono'}
                    <DatabaseTable
                        config={proBonoConfig}
                        supabase={supabase}
                        initialData={proBonoProjects}
                        onDataChange={(data) => proBonoProjects = data}
                    />
                {/if}
            </div>
        </div>
    </section>
{/each}
                {/if}
                <NewProjectModal
                    show={showNewProjectModal}
                    projectType={selectedProjectType}
                    on:projectAdded={handleProjectAdded}
                    on:close={() => showNewProjectModal = false}
                />
            </div>

            <!-- Sidebar -->
            <div class="sidebar">
                <!-- Company Tools -->
                <div class="tools-card">
                    <div class="tools-header">
                        <h3>Company Tools</h3>
                    </div>
                    <div class="tools-list">
                        <a href="/company/funding" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-money-bill"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Fundraising</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/cloud-costs" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-cloud"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Cloud Cost Calculator</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/structure" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-project-diagram"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Company Structure</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/organization-chart" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-sitemap"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Organization Chart</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/pressure-calculator" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-gauge-high"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Pressure Calculator</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/team" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Team Meetings</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/info" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Company Information</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                    </div>
                </div>
                
                <!-- Sidebar Quick Stats (example, non-funding) -->
                <div class="stats-card">
                    <div class="stats-header">
                        <h3>Quick Stats</h3>
                    </div>
                    <div class="quick-stats">
                        <div class="stat-item">
                            <div class="stat-label">Active Projects</div>
                            <div class="stat-value">{activeProjects.length}</div>
                        </div>
                        <!-- Add other non-funding stats here if desired -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>



<style>
    .page-container {
        min-height: 100vh;
        background-color: #f9fafb;
        padding: 2rem;
        border-left: 1px solid #e5e7eb;
    }

    .content {
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e5e7eb;
    }

    .header h1 {
        font-size: 2rem;
        font-weight: bold;
        color: #111827;
    }

    .header p {
        color: #6b7280;
        margin-top: 0.5rem;
    }

    .add-button {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background-color: #4f46e5;
        color: white;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    }

    .add-button:hover {
        background-color: #4338ca;
    }

    .add-button i {
        margin-right: 0.5rem;
    }

    .main-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 2rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stats-grid :global(.card) {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
    }

    .stats-grid :global(.card:hover) {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
    }

    .chart-card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .chart-container {
        padding: 1rem;
        height: 300px;
    }

    @media (prefers-color-scheme: dark) {
        .chart-card {
            background-color: var(--surface-2);
        }

        .chart-header {
            border-bottom-color: #374151;
        }
    }

    .funding-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .funding-tags {
        display: flex;
        gap: 0.5rem;
    }

    .tag {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
    }

    .tag i {
        margin-right: 0.25rem;
    }

    .tag.investor {
        background-color: #e0e7ff;
        color: #4f46e5;
    }

    .tag.founders {
        background-color: #d1fae5;
        color: #059669;
    }

    .tag.sweat-equity {
        background-color: #fbcfe8;
        color: #be185d;
    }

    .tag.client {
        background-color: #d1fae5;
        color: #059669;
    }

    .tag.other {
        background-color: #fef3c7;
        color: #d97706;
    }

    .funding-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .funding-item {
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background-color: white;
        transition: all 0.2s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .funding-item:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .source-type {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }

    .amount-info {
        text-align: right;
    }

    .amount {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
    }

    .date {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
    }

    .notes {
        margin-top: 0.5rem;
        padding: 0.5rem 0 0.5rem 1rem;
        border-left: 2px solid #e5e7eb;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .sidebar :global(.card) {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
    }

    .sidebar :global(.card:hover) {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .tool-link {
        display: block;
        padding: 0.5rem 1rem;
        color: #4b5563;
        border-radius: 0.375rem;
        border: 1px solid transparent;
        transition: all 0.2s ease-in-out;
    }

    .tool-link:hover {
        background: var(--surface-3, #f3f4f6);
        color: #111827;
        border-color: #e5e7eb;
    }

    .stats-card {
        background: var(--surface-2, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .stats-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
    }

    .quick-stats {
        padding: 1rem;
    }

    .stat-item {
        padding: 0.75rem;
        background: var(--surface-1, #f9fafb);
        border-radius: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .stat-item:last-child {
        margin-bottom: 0;
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        margin-bottom: 0.25rem;
    }

    .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-1, #111827);
    }

    .tools-card {
        background: var(--surface-2, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    .tools-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .tools-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
    }

    .tools-list {
        padding: 0.75rem;
    }

    .tool-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 0.5rem;
        color: var(--text-1, #111827);
        text-decoration: none;
        transition: all 0.2s ease-in-out;
        margin-bottom: 0.5rem;
    }

    .tool-item:last-child {
        margin-bottom: 0;
    }

    .tool-item:hover {
        background: var(--surface-3, #f3f4f6);
    }

    .tool-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.5rem;
        background: var(--primary-color, #4f46e5);
        color: white;
        margin-right: 1rem;
    }

    .tool-content {
        flex: 1;
    }

    .tool-content h4 {
        font-size: 1rem;
        font-weight: 500;
        margin: 0;
        color: var(--text-1, #111827);
    }

    .tool-arrow {
        color: var(--text-2, #6b7280);
        font-size: 0.875rem;
    }

    /* Responsive Design */
    @media (max-width: 1280px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 1024px) {
        .main-grid {
            grid-template-columns: 1fr;
        }

        .charts-grid {
            grid-template-columns: 1fr;
        }

        .sidebar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
    }

    @media (max-width: 640px) {
        .page-container {
            padding: 1rem;
        }

        .header {
            flex-direction: column;
            gap: 1rem;
        }

        .funding-header {
            flex-direction: column;
            gap: 1rem;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .chart-card {
            background: var(--surface-2, #1f2937);
        }

        .chart-header h3 {
            color: var(--text-1, #f3f4f6);
        }

        .chart-button {
            color: var(--text-2, #9ca3af);
        }

        .chart-button:hover {
            background: var(--surface-3, #374151);
            color: var(--text-1, #f3f4f6);
        }

        .tools-card {
            background: var(--surface-2, #1f2937);
        }

        .tools-header h3 {
            color: var(--text-1, #f3f4f6);
        }

        .tool-item {
            color: var(--text-1, #f3f4f6);
        }

        .tool-item:hover {
            background: var(--surface-3, #374151);
        }

        .tool-content h4 {
            color: var(--text-1, #f3f4f6);
        }

        .tool-arrow {
            color: var(--text-2, #9ca3af);
        }

        .stats-card {
            background: var(--surface-2, #1f2937);
        }

        .stats-header h3 {
            color: var(--text-1, #f3f4f6);
        }

        .stat-item {
            background: var(--surface-1, #111827);
        }

        .stat-label {
            color: var(--text-2, #9ca3af);
        }

        .stat-value {
            color: var(--text-1, #f3f4f6);
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }

        .chart-card {
            padding: 1rem;
        }

        .chart-container {
            height: 250px;
        }

        .tools-card {
            margin-bottom: 1rem;
        }

        .tools-header {
            padding: 1rem;
        }

        .tools-list {
            padding: 0.5rem;
        }

        .tool-item {
            padding: 0.75rem;
        }

        .tool-icon {
            width: 2rem;
            height: 2rem;
            margin-right: 0.75rem;
        }

        .stats-card {
            margin-bottom: 1rem;
        }

        .stats-header {
            padding: 1rem;
        }

        .quick-stats {
            padding: 0.75rem;
        }

        .stat-item {
            padding: 0.625rem;
        }
    }
.project-card {
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1.5px 4px rgba(0,0,0,0.03);
    padding: 2rem 2rem 1.5rem 2rem;
    margin-bottom: 2rem;
    transition: box-shadow 0.2s;
}
.project-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.06);
}
.table-container {
    margin-top: 1rem;
}
.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
}
.section-header h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
}
.section-description {
    color: #6b7280;
    font-size: 1rem;
    flex: 1 1 200px;
    margin: 0 1rem;
}
.add-project-btn {
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.15s;
}
.add-project-btn:hover {
    background: #1d4ed8;
}
@media (max-width: 700px) {
    .project-card {
        padding: 1rem 0.5rem 1rem 0.5rem;
    }
    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}

</style>
