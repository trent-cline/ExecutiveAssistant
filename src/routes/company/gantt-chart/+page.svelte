<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';
import GanttChart from '$lib/components/GanttChart.svelte';
import ProjectModal from '$lib/components/ProjectModa.svelte';
interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string;
    custom_class?: string;
    projectType?: 'active' | 'mentor' | 'probono';
    parentId?: string;
}
import { parseISO, format, isValid } from 'date-fns';

interface BaseProject {
    id: string;
    company_name: string;
    status: string;
    created_at: string;
    target_launch_date?: string;
    milestones?: any[];
    type?: string;
}

let activeProjects: BaseProject[] = [];
let mentorToLaunchProjects: BaseProject[] = [];
let proBonoProjects: BaseProject[] = [];
let loading = true;
let error: string | null = null;

let viewMode: 'Day' | 'Week' | 'Month' = 'Month';

let ganttTasks: GanttTask[] = [];

// Project modal state
let showProjectModal = false;
let selectedProjectId: string | null = null;
let selectedProjectType: 'active' | 'mentor' | 'probono' = 'active';

onMount(async () => {
    await fetchProjects();
    buildGanttTasks();
});

async function fetchProjects() {
    loading = true;
    try {
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
}

function buildGanttTasks() {
    const allProjects = [
        ...activeProjects.map(p => ({ ...p, type: 'Active', projectType: 'active' })),
        ...mentorToLaunchProjects.map(p => ({ ...p, type: 'Mentor To Launch', projectType: 'mentor' })),
        ...proBonoProjects.map(p => ({ ...p, type: 'Pro Bono', projectType: 'probono' }))
    ];
    let tasks: GanttTask[] = [];
    allProjects.forEach(project => {
        // Project main bar
        let start = project.created_at;
        let end = project.target_launch_date || project.created_at;
        if (!isValid(parseISO(start))) start = new Date().toISOString();
        if (!isValid(parseISO(end))) end = start;
        tasks.push({
            id: project.id,
            name: project.company_name || 'Unnamed Project',
            start,
            end,
            progress: 0,
            custom_class: project.type?.toLowerCase().replace(/ /g, '-'),
            projectType: project.projectType as 'active' | 'mentor' | 'probono' // Store project type for modal
        });
        // Milestones as diamond markers
        if (project.milestones && Array.isArray(project.milestones)) {
            project.milestones.forEach((m: any, idx: number) => {
                if (m.due_date && isValid(parseISO(m.due_date))) {
                    tasks.push({
                        id: `${project.id}-ms-${idx}`,
                        name: `⯁ ${m.title || 'Milestone'}`,
                        start: m.due_date,
                        end: m.due_date,
                        progress: 100,
                        dependencies: project.id,
                        custom_class: 'milestone',
                        projectType: project.projectType as 'active' | 'mentor' | 'probono', // Store project type for modal
                        parentId: project.id // Store parent project ID
                    });
                }
            });
        }
    });
    ganttTasks = tasks;
}

$: if (!loading) buildGanttTasks();

// Handle task click from Gantt chart
function handleTaskClick(event: CustomEvent) {
    const { taskId, isMilestone, name } = event.detail;
    
    // For milestones, extract the parent project ID
    let projectId = taskId;
    let projectType = 'active';
    
    // Find the task in ganttTasks
    const task = ganttTasks.find(t => t.id === taskId);
    
    if (task) {
        if (isMilestone && task.parentId) {
            // If it's a milestone, use the parent project ID
            projectId = task.parentId;
        }
        
        if (task.projectType) {
            projectType = task.projectType;
        }
        
        // Open the project modal
        selectedProjectId = projectId;
        selectedProjectType = projectType as 'active' | 'mentor' | 'probono';
        showProjectModal = true;
    }
}
</script>

<svelte:head>
    <title>Project Gantt Chart - Pillar Apps</title>
</svelte:head>

<div class="gantt-container">
    <header>
        <h1>Project Gantt Chart</h1>
        <p>Visual timeline of all projects and milestones</p>
    </header>
    <div class="controls">
        <label for="viewMode">View Mode:</label>
        <select id="viewMode" bind:value={viewMode}>
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
        </select>
    </div>
    {#if loading}
        <div class="loading"><p>Loading projects data...</p></div>
    {:else if error}
        <div class="error"><p>{error}</p></div>
    {:else}
        <GanttChart tasks={ganttTasks} view_mode={viewMode} on:taskClick={handleTaskClick} />
    {/if}
    
    {#if showProjectModal}
        <ProjectModal
            bind:show={showProjectModal}
            projectId={selectedProjectId}
            projectType={selectedProjectType}
            on:updated={() => fetchProjects().then(buildGanttTasks)}
        />
    {/if}
    <div class="legend">
        <span class="legend-box active"></span> Active Projects
        <span class="legend-box mentor"></span> Mentor To Launch
        <span class="legend-box probono"></span> Pro Bono
        <span class="legend-box milestone"></span> Milestone
    </div>
</div>

<style>
.gantt-container {
    padding: 2rem;
    background: var(--background, #f3f4f6);
    min-height: 100vh;
}
header {
    margin-bottom: 2rem;
    text-align: center;
}
h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: var(--foreground, #1f2937);
}
p { color: var(--muted, #6b7280); }
.controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
}
.loading, .error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60vh;
    background: white;
    border-radius: 0.5rem;
}
.error { color: #ef4444; }
.legend {
    display: flex;
    gap: 1.5rem;
    margin-top: 1.5rem;
    justify-content: center;
    align-items: center;
}
.legend-box {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 3px;
    margin-right: 0.5em;
    vertical-align: middle;
}
.legend-box.active { background: #36a2eb; }
.legend-box.mentor { background: #ff9f40; }
.legend-box.probono { background: #9966ff; }
.legend-box.milestone { background: #eab308; border-radius: 50%; }
@media (max-width: 768px) {
    .gantt-container { padding: 1rem; }
    .controls { flex-direction: column; }
}
</style>
