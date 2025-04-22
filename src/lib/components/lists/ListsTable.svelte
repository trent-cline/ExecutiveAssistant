<script lang="ts">
  import ListRow from './ListRow.svelte';
  import type { ListItem } from '$lib/types/lists';
  export let items: ListItem[] = [];
  export let loading = false;
  export let error = '';
  export let onEdit: (item: ListItem) => void;
  export let onDelete: (item: ListItem) => void;
  export let onCheck: (item: ListItem) => void;
</script>

<div class="list-table-wrapper">
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  <table class="custom-table">
    <thead>
      <tr>
        <th>Action</th>
        <th>Name</th>
        <th>Description</th>
        <th>Status</th>
        <th>Priority</th>
        <th>Checked</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item, i (item.id)}
        <ListRow {item} {onEdit} {onDelete} {onCheck} className={i % 2 === 0 ? 'bg-blue-50/60' : 'bg-white'} />
      {/each}
    </tbody>
  </table>
</div>

<style>
.list-table-wrapper {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 6px 32px 0 rgb(59 130 246 / 0.08), 0 1.5px 4px -1px rgb(99 102 241 / 0.10);
  padding: 2rem 1.25rem;
  margin-bottom: 2rem;
}
.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 1.5rem;
  overflow: hidden;
}
.custom-table th {
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  font-weight: 700;
  padding: 1rem;
}
.custom-table td {
  padding: 0.75rem;
  font-size: 1rem;
}
</style>
