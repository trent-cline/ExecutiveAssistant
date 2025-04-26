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
];

let activeProjects = [];
let mentorToLaunchProjects = [];
let proBonoProjects = [];
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
  } catch (e) {
    error = e.message || 'Failed to load projects.';
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
        <section class="dashboard">
            <ProjectsSummaryStats
                totalProjects={totalProjects}
                active={activeProjects.length}
                mentor={mentorToLaunchProjects.length}
                probono={proBonoProjects.length}
            />
        </section>
    </header>

    <section class="tools-section">
        <h2>Company Tools</h2>
        <CompanyToolsNav {toolLinks} />
    </section>

    <section class="projects-section">
        <h2>Projects</h2>
        <div class="projects-tables">
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
                                    <th>Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each activeProjects as proj}
                                    <tr>
                                        <td>{proj.name}</td>
                                        <td>{proj.status}</td>
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
                                    <th>Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each mentorToLaunchProjects as proj}
                                    <tr>
                                        <td>{proj.name}</td>
                                        <td>{proj.status}</td>
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
                                    <th>Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each proBonoProjects as proj}
                                    <tr>
                                        <td>{proj.name}</td>
                                        <td>{proj.status}</td>
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
    </section>
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
  margin-bottom: 2rem;
}
.dashboard {
  display: flex;
  justify-content: center;
  margin: 1rem 0 2rem 0;
}
.dashboard-card {
  display: flex;
  gap: 2rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1.5px 4px rgba(0,0,0,0.03);
  padding: 1.5rem 2rem;
}
.dashboard-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-label {
  color: #888;
  font-size: 0.9rem;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}
.tools-section {
  margin-bottom: 2rem;
}
.tools-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}
.tool-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  color: #222;
  font-weight: 500;
  transition: background 0.2s;
}
.tool-link:hover {
  background: #e5e7eb;
}
.projects-section {
  margin-top: 2rem;
}
.projects-tables {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: space-between;
}
.project-table {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1.5px 4px rgba(0,0,0,0.03);
  padding: 1rem 1.5rem;
  flex: 1 1 250px;
  min-width: 250px;
}
.project-table h3 {
  margin-bottom: 0.75rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.error {
  color: #d32f2f;
  font-weight: bold;
}
@media (max-width: 900px) {
  .projects-tables {
    flex-direction: column;
    gap: 1.5rem;
  }
  .dashboard-card {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
}


</style>
