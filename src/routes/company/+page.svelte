<script lang="ts">
import CompanyToolsNav from '$lib/components/CompanyToolsNav.svelte';
import ProjectsSummaryStats from '$lib/components/ProjectsSummaryStats.svelte';
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';

// Company tools links
const toolLinks = [
  { href: '/company/info', icon: 'fa-circle-info', label: 'Company Info' },
  { href: '/company/funding', icon: 'fa-money-bill', label: 'Fundraising' },
  { href: '/company/cloud-costs', icon: 'fa-cloud', label: 'Cloud Costs' },
  { href: '/company/structure', icon: 'fa-project-diagram', label: 'Company Structure' },
  { href: '/company/team', icon: 'fa-users', label: 'Team' },
  { href: '/company/organization-chart', icon: 'fa-sitemap', label: 'Org Chart' },
  { href: '/company/pressure-calculator', icon: 'fa-gauge-high', label: 'Pressure Calculator' },
  { href: '/projects', icon: 'fa-table-columns', label: 'Project Dashboard' },
  { href: '/company/gantt-chart', icon: 'fa-chart-gantt', label: 'Gantt Chart' },
  { href: '/rag', icon: 'fa-robot', label: 'RAG Assistant' },
];

interface Project {
  id: string;
  company_name?: string;
  status?: string;
  created_at?: string;
  target_launch_date?: string;
  milestones?: any[];
}

let activeProjects: Project[] = [];
let mentorToLaunchProjects: Project[] = [];
let proBonoProjects: Project[] = [];
let loading = true;
let error: string | null = null;

onMount(async () => {
  loading = true;
  try {
    // Fetch projects from Supabase (update table names as needed)
    const { data: active, error: err1 } = await supabase.from('active_projects').select('*');
    const { data: mentor, error: err2 } = await supabase.from('mentor_to_launch_projects').select('*');
    const { data: probono, error: err3 } = await supabase.from('pro_bono_projects').select('*');
    if (err1 || err2 || err3) throw err1 || err2 || err3;
    activeProjects = active || [];
    mentorToLaunchProjects = mentor || [];
    proBonoProjects = probono || [];
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to load projects.';
    error = errorMessage;
  } finally {
    loading = false;
  }
});

// Dashboard summary
$: totalProjects = activeProjects.length + mentorToLaunchProjects.length + proBonoProjects.length;
</script>

<svelte:head>
    <title>Pillar Apps - Company Dashboard</title>
</svelte:head>

<div class="page-container">
    <header class="company-header">
        <h1>Pillar Apps, LLC</h1>
    </header>

    <div class="dashboard-section">
        <ProjectsSummaryStats
            totalProjects={totalProjects}
            active={activeProjects.length}
            mentor={mentorToLaunchProjects.length}
            probono={proBonoProjects.length}
        />
    </div>

    <div class="main-content">
        <div class="projects-section">
            <h2>Projects</h2>
            
            <div class="project-table">
                <h3>Active Projects</h3>
                {#if loading}
                    <p>Loading...</p>
                {:else if error}
                    <p class="error">{error}</p>
                {:else}
                    {#if activeProjects.length}
                        <table>
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Target Launch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each activeProjects as proj}
                                    <tr>
                                        <td>{proj.company_name || 'Unnamed'}</td>
                                        <td>{proj.status || 'N/A'}</td>
                                        <td>{proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'N/A'}</td>
                                        <td>{proj.target_launch_date ? new Date(proj.target_launch_date).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <p>No active projects.</p>
                    {/if}
                {/if}
            </div>
            
            <div class="project-table">
                <h3>Mentor To Launch</h3>
                {#if loading}
                    <p>Loading...</p>
                {:else if error}
                    <p class="error">{error}</p>
                {:else}
                    {#if mentorToLaunchProjects.length}
                        <table>
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Target Launch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each mentorToLaunchProjects as proj}
                                    <tr>
                                        <td>{proj.company_name || 'Unnamed'}</td>
                                        <td>{proj.status || 'N/A'}</td>
                                        <td>{proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'N/A'}</td>
                                        <td>{proj.target_launch_date ? new Date(proj.target_launch_date).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <p>No Mentor To Launch projects.</p>
                    {/if}
                {/if}
            </div>
            
            <div class="project-table">
                <h3>Pro Bono</h3>
                {#if loading}
                    <p>Loading...</p>
                {:else if error}
                    <p class="error">{error}</p>
                {:else}
                    {#if proBonoProjects.length}
                        <table>
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Target Launch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each proBonoProjects as proj}
                                    <tr>
                                        <td>{proj.company_name || 'Unnamed'}</td>
                                        <td>{proj.status || 'N/A'}</td>
                                        <td>{proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'N/A'}</td>
                                        <td>{proj.target_launch_date ? new Date(proj.target_launch_date).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <p>No Pro Bono projects.</p>
                    {/if}
                {/if}
            </div>
        </div>
        
        <div class="tools-sidebar">
            <h2>Company Tools</h2>
            <CompanyToolsNav {toolLinks} />
        </div>
    </div>
</div>

<style>
.page-container {
  min-height: 100vh;
  background: var(--background, #f3f4f6);
  padding: 2rem;
  color: var(--foreground, #1f2937);
}

.company-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.dashboard-section {
  margin-bottom: 2rem;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: start;
}

.projects-section {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1.5px 4px rgba(0,0,0,0.03);
  padding: 1.5rem;
}

.tools-sidebar {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1.5px 4px rgba(0,0,0,0.03);
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
}

.project-table {
  margin-bottom: 2rem;
}

.project-table h3 {
  margin-bottom: 1rem;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.projects-section h2, .tools-sidebar h2 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #374151;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  font-weight: 600;
  color: #6b7280;
  background-color: #f9fafb;
}

tr:hover {
  background-color: #f9fafb;
}

.error {
  color: #ef4444;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .tools-sidebar {
    position: static;
    margin-top: 2rem;
  }
}
</style>
