<script lang="ts">
    import { getModalStore } from '@skeletonlabs/skeleton';
    const modalStore = getModalStore();

    export let parent: any;

    let newContact = {
        display_name: '',
        first_name: '',
        last_name: '',
        relationship_type: 'other',
        mobile_number: '',
        email_address: '',
        is_active: true
    };

    function onFormSubmit() {
        if (newContact.display_name) {
            parent.onSubmit(newContact);
            modalStore.close();
        }
    }
</script>

<div class="card p-4">
    <form on:submit|preventDefault={onFormSubmit} class="space-y-4">
        <label class="label">
            <span>Display Name*</span>
            <input
                class="input"
                type="text"
                bind:value={newContact.display_name}
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
                    bind:value={newContact.first_name}
                    placeholder="Enter first name"
                />
            </label>
            <label class="label">
                <span>Last Name</span>
                <input
                    class="input"
                    type="text"
                    bind:value={newContact.last_name}
                    placeholder="Enter last name"
                />
            </label>
        </div>
        <label class="label">
            <span>Group</span>
            <select class="select" bind:value={newContact.relationship_type}>
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
                    bind:value={newContact.mobile_number}
                    placeholder="Enter mobile number"
                />
            </label>
            <label class="label">
                <span>Email</span>
                <input
                    class="input"
                    type="email"
                    bind:value={newContact.email_address}
                    placeholder="Enter email address"
                />
            </label>
        </div>
        <footer class="flex justify-end space-x-2">
            <button type="button" class="btn variant-ghost-surface" on:click={() => modalStore.close()}>
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn variant-filled-primary"
                disabled={!newContact.display_name}
            >
                Save Contact
            </button>
        </footer>
    </form>
</div>
