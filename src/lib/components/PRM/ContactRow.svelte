<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let contact: any;
  export let onEdit: (contact: any) => void = () => {};
  export let className: string = '';
  const dispatch = createEventDispatcher();

  function handleRowClick(e: MouseEvent) {
    // Prevent rowClick when clicking on buttons inside the row
    if ((e.target as HTMLElement).closest('button')) return;
    dispatch('rowClick', contact);
  }
  function handleRowKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      dispatch('rowClick', contact);
    }
  }
</script>

<tr
  class={className}
  tabindex="0"
  style="cursor:pointer;"
  on:click={handleRowClick}
  on:keydown={handleRowKeydown}
  role="button"
  aria-label="View contact details"
>
  <td>{contact.display_name}</td>
  <td>{contact.relationship_type}</td>
  <td>{contact.mobile_number}</td>
  <td>{contact.email_address}</td>
  <td>{contact.birth_date}</td>
  <td>{contact.last_contact_date}</td>
  <td>
    <button
      title="Edit"
      class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1"
      on:click={(e) => {
        e.stopPropagation();
        onEdit(contact);
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3z" /></svg>
      Edit
    </button>
  </td>
</tr>

<style>
  td button {
    outline: none;
  }
</style>
