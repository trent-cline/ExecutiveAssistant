<script lang="ts">
  export let rows = 5;
</script>

<div class="skeleton-loader">
  {#each Array(rows) as _, i}
    <div class="skeleton-row" key={i}>
      <div class="skeleton-cell w-1/5"></div>
      <div class="skeleton-cell w-1/3"></div>
      <div class="skeleton-cell w-1/12"></div>
      <div class="skeleton-cell w-1/6"></div>
      <div class="skeleton-cell w-1/6"></div>
      <div class="skeleton-cell w-1/12"></div>
    </div>
  {/each}
</div>

<style>
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}
.skeleton-row {
  display: flex;
  background: #f3f4f6;
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  animation: pulse 1.5s infinite;
  min-height: 2.5rem;
}
.skeleton-cell {
  background: #e5e7eb;
  border-radius: 0.5rem;
  height: 1.25rem;
  margin-right: 1rem;
}
.w-1\/5 { width: 20%; }
.w-1\/3 { width: 33%; }
.w-1\/12 { width: 8%; }
.w-1\/6 { width: 16.6%; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
