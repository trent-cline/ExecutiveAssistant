<script lang="ts">
  export let toolLinks: Array<{ href: string; icon: string; label: string }> = [];
</script>
<nav class="tools-links">
  {#each toolLinks as tool}
    <a class="tool-link" href={tool.href} title={tool.label}>
      <i class={`fa ${tool.icon}`}></i> {tool.label}
    </a>
  {/each}
</nav>
<style>
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
</style>
