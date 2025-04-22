<script lang="ts">
  export let item;
  export let onEdit;
  export let onDelete;
  export let onCheck;
  export let className = '';
</script>
<tr class={className}>
  <td class="flex gap-2 py-2">
    <button title="Edit" class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1" on:click={() => onEdit(item)}>
      <i class="fas fa-edit"></i>
    </button>
    <button title="Delete" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1" on:click={() => onDelete(item)}>
      <i class="fas fa-trash"></i>
    </button>
    <button title="Check/Uncheck" class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1" on:click={() => onCheck(item)}>
      <i class={item.checked ? 'fas fa-check-square' : 'far fa-square'}></i>
    </button>
  </td>
  <td class="font-medium text-gray-900">{item.name}</td>
  <td class="text-gray-700">{item.summary || item.description}</td>
  <td>{item.status}</td>
  <td>{item.priority}</td>
  <td>{item.checked ? '✔️' : ''}</td>
</tr>
