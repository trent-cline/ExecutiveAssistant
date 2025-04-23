<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import NoteRow from './NoteRow.svelte';
  import SkeletonLoader from './SkeletonLoader.svelte';
  import EditNoteModal from './EditNoteModal.svelte';
  import NoteToListRouter from './NoteToListRouter.svelte';
  import DetailModal from './DetailModal.svelte';
  import type { Note } from '$lib/types/notes';

  export let hideCompleted = false;

  let notes: Note[] = [];
  let loading = true;
  let error = '';
  let showEditModal = false;
  let editingNote: Note | null = null;
  let showListRouterModal = false;
  let selectedNoteForList: Note | null = null;
  let showDetailModal = false;
  let selectedDetailNote: Note | null = null;

  async function loadNotes() {
    loading = true;
    error = '';
    try {
      let query = supabase.from('brain_dump').select('*');
      if (hideCompleted) query = query.not('status', 'eq', 'Done');
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      notes = data || [];
    } catch (err: any) {
      error = err.message || 'Failed to load notes.';
    } finally {
      loading = false;
    }
  }

  onMount(loadNotes);

  function handleEdit(note: Note) {
    editingNote = note;
    showEditModal = true;
  } // This handler is correct for opening the modal with the selected note.
  async function handleMarkComplete(note: Note) {
    try {
      const { error: updateError } = await supabase
        .from('brain_dump')
        .update({ status: 'Done' })
        .eq('id', note.id);
      if (updateError) throw updateError;
      await loadNotes();
    } catch (err) {
      error = err.message || 'Failed to mark as complete.';
    }
  }
  function handleSendToList(note: Note) {
    selectedNoteForList = note;
    showListRouterModal = true;
  }
  function handleEditSave() {
    showEditModal = false;
    editingNote = null;
    loadNotes();
  }
  function handleListRouterClose() {
    showListRouterModal = false;
    selectedNoteForList = null;
  }
  function handleListRouterSuccess() {
    showListRouterModal = false;
    selectedNoteForList = null;
    loadNotes();
  }
</script>

<div class="brain-table-outer">

  {#if error}
    <div class="bg-red-100 border border-red-300 text-red-700 rounded p-4 my-4 flex flex-col items-start">
      <p class="mb-2">{error}</p>
      <button class="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" on:click={loadNotes}>
        Retry
      </button>
    </div>
  {/if}

  {#if loading}
    <SkeletonLoader rows={5} />
  {:else}
    <style src="./BrainInboxTable.mobile.css"></style>
    <div class="overflow-hidden">
      <table class="min-w-full bg-white rounded-2xl shadow-xl">
        <thead>
          <tr class="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400">
            <th class="px-6 py-4"></th>
            <th class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
            <th class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Due Date</th>
            <th class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Priority</th>
            <th class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Category</th>
            <th class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Summary</th>
          </tr>
        </thead>
        <tbody>
          {#each notes as note, i (note.id)}
            <NoteRow
              {note}
              onMarkComplete={handleMarkComplete}
              onSendToList={handleSendToList}
              on:rowClick={() => { selectedDetailNote = note; showDetailModal = true; }}
              className={`transition-colors duration-150 ${i % 2 === 0 ? 'bg-blue-50/60' : 'bg-white'} hover:bg-blue-100`}
            />
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if showEditModal && editingNote}
    <EditNoteModal
      note={editingNote}
      show={showEditModal}
      on:close={() => {
        showEditModal = false;
        editingNote = null;
      }}
      on:save={handleEditSave}
    />
  {/if} <!-- EditNoteModal now supports skeleton UI loader while saving -->
  {#if showListRouterModal && selectedNoteForList}
    <NoteToListRouter
      note={selectedNoteForList}
      showModal={true}
      on:close={handleListRouterClose}
      on:success={handleListRouterSuccess}
    />
  {/if}
  {#if showDetailModal && selectedDetailNote}
    <DetailModal
      show={showDetailModal}
      note={selectedDetailNote}
      on:close={() => { showDetailModal = false; selectedDetailNote = null; }}
      on:save={async (e) => {
        let updated = e.detail.note;
        loading = true;
        error = '';
        try {
          const { error: updateError } = await supabase
            .from('brain_dump')
            .update({
              name: updated.name,
              summary: updated.summary,
              status: updated.status,
              priority: updated.priority,
              category: updated.category,
              due_date: updated.due_date
            })
            .eq('id', updated.id);
          if (updateError) throw updateError;
          showDetailModal = false;
          selectedDetailNote = null;
          await loadNotes();
        } catch (err) {
          error = err.message || 'Failed to update note.';
        } finally {
          loading = false;
        }
      }}
    />
  {/if}
</div>
