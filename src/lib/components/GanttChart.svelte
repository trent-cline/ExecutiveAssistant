<script lang="ts">
// Import Gantt directly from CDN in svelte:head
import { onMount, createEventDispatcher } from 'svelte';

// Define task interface
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

export let tasks: GanttTask[] = [];
export let view_mode: 'Day' | 'Week' | 'Month' = 'Month';

let container: HTMLElement;
let gantt: any; // Using any for the Gantt instance since it's from a third-party library

// Create event dispatcher for task click events
const dispatch = createEventDispatcher();

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function initGantt() {
  if (!container || !tasks || tasks.length === 0 || !window.Gantt) {
    console.log('Cannot initialize Gantt: missing container, tasks, or Gantt library');
    return;
  }

  // Format tasks for Gantt chart
  const formattedTasks = tasks.map(task => ({
    id: task.id,
    name: task.name,
    start: formatDate(task.start),
    end: formatDate(task.end),
    progress: task.progress || 0,
    dependencies: task.dependencies || '',
    custom_class: task.custom_class || ''
  }));

  // Clear previous chart
  if (gantt) {
    container.innerHTML = '';
  }

  try {
    // Create new chart
    gantt = new window.Gantt(container, formattedTasks, {
      view_mode: view_mode,
      bar_height: 30,
      padding: 18,
      popup_trigger: 'click',
      custom_popup_html: (task: any) => {
        // Dispatch task click event with task data
        dispatch('taskClick', { 
          taskId: task.id,
          name: task.name,
          isMilestone: task.custom_class === 'milestone'
        });
        return '';
      }
    });
  } catch (error) {
    console.error('Error initializing Gantt chart:', error);
  }
}

// Initialize chart when component mounts
onMount(() => {
  // Wait for Gantt library to load
  const checkGantt = setInterval(() => {
    if (window.Gantt) {
      clearInterval(checkGantt);
      setTimeout(initGantt, 100); // Small delay to ensure DOM is ready
    }
  }, 100);
});

// Update chart when tasks or view_mode changes
$: if (container && tasks && tasks.length > 0 && window.Gantt) {
  initGantt();
}

$: if (gantt && view_mode) {
  try {
    gantt.change_view_mode(view_mode);
  } catch (error) {
    console.error('Error changing view mode:', error);
  }
}
</script>

<svelte:head>
  <!-- Load frappe-gantt from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.css">
</svelte:head>

<div class="gantt-container">
  <div bind:this={container} class="gantt-chart"></div>
</div>

<style>
.gantt-container {
  width: 100%;
  overflow: hidden;
  margin-top: 1rem;
}

.gantt-chart {
  width: 100%;
  min-height: 400px;
  overflow-x: auto;
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
