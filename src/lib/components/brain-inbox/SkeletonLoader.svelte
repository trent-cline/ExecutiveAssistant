<script lang="ts">
  export let rows = 5;
</script>

<div class="skeleton-loader">
  {#each Array(rows) as _, i}
    <div class="skeleton-card" key={i}>
      <div class="skeleton-title"></div>
      <div class="skeleton-lines"></div>
    </div>
  {/each}
</div>

<style>
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}
.skeleton-card {
  background: #f3f4f6;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 80px;
  animation: pulse 1.5s infinite;
}
.skeleton-title {
  width: 40%;
  height: 1.2rem;
  background: #e5e7eb;
  border-radius: 0.5rem;
}
.skeleton-lines {
  width: 100%;
  height: 0.8rem;
  background: #e5e7eb;
  border-radius: 0.5rem;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
