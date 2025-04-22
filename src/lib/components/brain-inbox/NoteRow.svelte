<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let note;
  export let onMarkComplete;
  export let onSendToList;
  export let className: string = '';
  const dispatch = createEventDispatcher();

  function handleRowClick(e: MouseEvent) {
    // Prevent rowClick when clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    dispatch('rowClick', note);
  }
  function handleRowKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      dispatch('rowClick', note);
    }
  }
</script>

<tr class={className} tabindex="0" style="cursor:pointer;" on:click={handleRowClick} on:keydown={handleRowKeydown} role="button" aria-label="View note details">
  <td class="flex gap-2 py-2">
    <button title="Send to Shopping List" class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1" on:click={() => onSendToList(note)}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A1 1 0 007.5 17h9a1 1 0 00.95-.68L21 13M16 21a2 2 0 11-4 0 2 2 0 014 0zm-6 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    </button>
    <button title="Mark Complete" class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1" on:click={() => onMarkComplete(note)}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
    </button>
    <button title="Send to List" class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1" on:click={() => onSendToList(note)}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v16h16M4 4l16 16" /></svg>
    </button>
  </td>
  <td class="max-w-xs overflow-hidden whitespace-nowrap text-ellipsis font-medium text-gray-900">{note.name}</td>
  <td>
    <span class="px-2 py-1 rounded-full text-xs font-semibold 
      {note.status === 'Done' ? 'bg-green-100 text-green-700' : note.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'}">
      {note.status}
    </span>
  </td>
  <td class="text-gray-700">{note.due_date ? new Date(note.due_date).toLocaleDateString() : ''}</td>
  <td>
    <span class="px-2 py-1 rounded-full text-xs font-semibold 
      {note.priority === 'High' ? 'bg-red-100 text-red-700' : note.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'}">
      {note.priority}
    </span>
  </td>
  <td class="text-gray-600">{note.category}</td>
  <td class="max-w-xs truncate text-gray-700">{note.summary}</td>
</tr>
