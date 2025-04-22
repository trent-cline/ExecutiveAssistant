<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Note } from '$lib/types/notes';
  export let show = false;
  export let note: Note | null = null;
  const dispatch = createEventDispatcher();
  let editNote: Note | null = null;
  // Only initialize editNote when opening, and clear when closing
  $: if (show && note && !editNote) { editNote = { ...note }; }
  $: if (!show) { editNote = null; }
  function close() { dispatch('close'); }
  function save() { dispatch('save', { note: editNote }); }
</script>

{#if show && editNote}
  <div class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" on:click={close}>
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative z-50" on:click|stopPropagation>
      <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600" on:click={close}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <form on:submit|preventDefault={save}>
        <h2 class="text-2xl font-bold mb-2 text-blue-700">
          <input class="w-full font-bold text-blue-700 bg-transparent border-none focus:ring-0 focus:outline-none text-2xl mb-1" bind:value={editNote.name} required />
        </h2>
        <div class="mb-4">
          <textarea class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition" rows="3" bind:value={editNote.summary} placeholder="Summary"></textarea>
        </div>
        <div class="flex flex-wrap gap-4 mb-4">
          <div>
            <span class="font-semibold">Status:</span>
            <select class="ml-2 px-2 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 focus:ring-blue-200 focus:outline-none"
              bind:value={editNote.status}>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>
          <div>
            <span class="font-semibold">Due:</span>
            <input class="ml-2 px-2 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 focus:ring-blue-200 focus:outline-none"
              type="date" bind:value={editNote.due_date} />
          </div>
          <div>
            <span class="font-semibold">Priority:</span>
            <select class="ml-2 px-2 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 focus:ring-blue-200 focus:outline-none"
              bind:value={editNote.priority}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <span class="font-semibold">Category:</span>
            <select class="ml-2 px-2 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 focus:ring-blue-200 focus:outline-none"
              bind:value={editNote.category}>
              <option>Note</option>
              <option>Task</option>
              <option>Reminder</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button type="button" class="btn btn-ghost" on:click={close}>Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
        <div class="text-sm text-gray-500 mt-4">Created: {editNote.created_at ? new Date(editNote.created_at).toLocaleString() : '—'}</div>
      </form>
    </div>
  </div>
{/if}
