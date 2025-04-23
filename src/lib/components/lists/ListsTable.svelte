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
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(-1 * (env(safe-area-inset-left, 0px)));
  margin-right: calc(-1 * (env(safe-area-inset-right, 0px)));
  background: #fff;
  border-radius: 0;
  box-shadow: 0 6px 32px 0 rgb(59 130 246 / 0.08), 0 1.5px 4px -1px rgb(99 102 241 / 0.10);
  padding: 0;
  margin-bottom: 2rem;
  overflow-x: auto;
}

.custom-table {
  width: 100vw;
  min-width: 600px;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0;
  background: white;
  overflow: hidden;
}

.custom-table th {
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  font-weight: 700;
  padding: 1rem 0.5rem;
}

.custom-table td {
  padding: 1rem 0.5rem;
  font-size: 1rem;
}

.list-table-wrapper .flex button, .list-table-wrapper button {
  min-width: 44px;
  min-height: 44px;
  font-size: 1.15em;
  margin: 0 0.2rem;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .list-table-wrapper {
    padding: 0;
    border-radius: 0;
    width: 100vw !important;
    max-width: 100vw !important;
    margin: 0 !important;
  }
  .custom-table {
    width: 100vw !important;
    min-width: 480px;
    border-radius: 0 !important;
  }
  .custom-table th, .custom-table td {
    padding: 0.75rem 0.25rem;
    font-size: 1rem;
  }
  .list-table-wrapper .flex button, .list-table-wrapper button {
    min-width: 44px;
    min-height: 44px;
    font-size: 1.15em;
    margin: 0 0.1rem;
    border-radius: 8px;
  }
}

</style>
