<script lang="ts">
  export let totalProjects: number;
  export let active: number;
  export let mentor: number;
  export let probono: number;
</script>
<div class="dashboard-card">
  <div class="dashboard-stat">
    <span class="stat-label">Total Projects</span>
    <span class="stat-value">{totalProjects}</span>
  </div>
  <div class="dashboard-stat">
    <span class="stat-label">Active</span>
    <span class="stat-value">{active}</span>
  </div>
  <div class="dashboard-stat">
    <span class="stat-label">Mentor To Launch</span>
    <span class="stat-value">{mentor}</span>
  </div>
  <div class="dashboard-stat">
    <span class="stat-label">Pro Bono</span>
    <span class="stat-value">{probono}</span>
  </div>
</div>
<style>
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
</style>
