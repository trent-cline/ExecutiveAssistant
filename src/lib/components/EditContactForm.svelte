<script lang="ts">
    import { getModalStore } from '@skeletonlabs/skeleton';
    import { supabase } from '$lib/supabase';
    const modalStore = getModalStore();

    export let parent: any;
    export let contact: any;

    let editedContact = { ...contact };
    let contactHistory: any[] = [];
    let isLoading = true;

    async function loadContactHistory() {
        isLoading = true;
        const { data, error } = await supabase
            .from('contact_history')
            .select('*')
            .eq('contact_id', contact.id)
            .order('interaction_date', { ascending: false });

        if (error) {
            console.error('Error loading contact history:', error);
            return;
        }

        contactHistory = data || [];
        isLoading = false;
    }

    async function addInteraction() {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('contact_history')
            .insert([{
                contact_id: contact.id,
                interaction_date: now,
                interaction_type: 'manual',
                notes: 'Contact details updated'
            }]);

        if (error) {
            console.error('Error adding interaction:', error);
            return;
        }

        await loadContactHistory();
    }

    async function onFormSubmit() {
        if (editedContact.display_name) {
            await parent.onUpdate(editedContact);
            await addInteraction();
            modalStore.close();
        }
    }

    // Load contact history when component mounts
    loadContactHistory();
</script>

<div class="card p-4 w-full max-w-3xl">
    <div class="flex justify-between items-center mb-4">
        <h3 class="h3">Edit Contact</h3>
        <button class="btn btn-sm variant-ghost-surface" on:click={() => modalStore.close()}>✕</button>
    </div>

    <form on:submit|preventDefault={onFormSubmit} class="space-y-4">
        <label class="label">
            <span>Display Name*</span>
            <input
                class="input"
                type="text"
                bind:value={editedContact.display_name}
                placeholder="Enter display name"
                required
            />
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="label">
                <span>First Name</span>
                <input
                    class="input"
                    type="text"
                    bind:value={editedContact.first_name}
                    placeholder="Enter first name"
                />
            </label>
            <label class="label">
                <span>Last Name</span>
                <input
                    class="input"
                    type="text"
                    bind:value={editedContact.last_name}
                    placeholder="Enter last name"
                />
            </label>
        </div>
        <label class="label">
            <span>Group</span>
            <select class="select" bind:value={editedContact.relationship_type}>
                <option value="immediate_family">Immediate Family</option>
                <option value="extended_family">Extended Family</option>
                <option value="friend">Friend</option>
                <option value="colleague">Colleague</option>
                <option value="client">Client</option>
                <option value="other">Other</option>
            </select>
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="label">
                <span>Mobile Number</span>
                <input
                    class="input"
                    type="tel"
                    bind:value={editedContact.mobile_number}
                    placeholder="Enter mobile number"
                />
            </label>
            <label class="label">
                <span>Email</span>
                <input
                    class="input"
                    type="email"
                    bind:value={editedContact.email_address}
                    placeholder="Enter email address"
                />
            </label>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="label">
                <span>Birth Date</span>
                <input
                    class="input"
                    type="date"
                    bind:value={editedContact.birth_date}
                />
            </label>
            <label class="label">
                <span>Last Contact Date</span>
                <input
                    class="input"
                    type="date"
                    bind:value={editedContact.last_contact_date}
                />
            </label>
        </div>

        <div class="divider my-8">Contact History</div>

        {#if isLoading}
            <div class="flex justify-center">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
        {:else if contactHistory.length === 0}
            <p class="text-center text-sm opacity-75">No interaction history found</p>
        {:else}
            <div class="space-y-2">
                {#each contactHistory as history}
                    <div class="card variant-ghost-surface p-3">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-semibold">{new Date(history.interaction_date).toLocaleDateString()}</p>
                                <p class="text-sm opacity-75">{history.interaction_type}</p>
                            </div>
                            {#if history.notes}
                                <p class="text-sm">{history.notes}</p>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <footer class="flex justify-end space-x-2 mt-8">
            <button type="button" class="btn variant-ghost-surface" on:click={() => modalStore.close()}>
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn variant-filled-primary"
                disabled={!editedContact.display_name}
            >
                Save Changes
            </button>
        </footer>
    </form>
</div>
