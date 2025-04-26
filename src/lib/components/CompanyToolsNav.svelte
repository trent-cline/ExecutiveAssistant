<script lang="ts">
  export let toolLinks: Array<{ href: string; icon: string; label: string }> = [];
</script>
<nav class="tools-links">
  {#each toolLinks as tool}
    <a class="tool-link" href={tool.href} title={tool.label}>
      <i class={`fa ${tool.icon}`}></i> <span class="tool-label">{tool.label}</span>
    </a>
  {/each}
</nav>
<style>
.tools-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.tool-link:hover {
  background: #e5e7eb;
  border-left-color: #6366f1;
  transform: translateX(2px);
}

.tool-link i {
  width: 20px;
  text-align: center;
  color: #6366f1;
}

.tool-label {
  flex: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tools-links {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .tool-link {
    flex: 1 1 calc(50% - 0.5rem);
    min-width: 120px;
    justify-content: center;
  }
}
</style>
