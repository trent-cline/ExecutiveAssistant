<script lang="ts">
    import { Table, getModalStore } from '@skeletonlabs/skeleton';
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import type { TableSource } from '@skeletonlabs/skeleton';
    import AddContactForm from '$lib/components/AddContactForm.svelte';
    import EditContactForm from '$lib/components/EditContactForm.svelte';

    const modalStore = getModalStore();
    let currentUserId: string | null = null;

    let tableSource: TableSource = {
        head: [
            { key: 'display_name', title: 'Name' },
            { key: 'relationship_type', title: 'Group' },
            { key: 'mobile_number', title: 'Mobile' },
            { key: 'email_address', title: 'Email' },
            { key: 'birth_date', title: 'Birth Date' },
            { key: 'last_contact_date', title: 'Last Contact' }
        ],
        body: []
    };
    
    // Upcoming birthdays table
    let upcomingBirthdaysSource: TableSource = {
        head: [
            { key: 'display_name', title: 'Name' },
            { key: 'relationship_type', title: 'Group' },
            { key: 'birth_date', title: 'Birth Date' },
            { key: 'days_until', title: 'Days Until' }
        ],
        body: []
    };

    // Mobile-responsive column configuration
    $: if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            tableSource.head = [
                { key: 'display_name', title: 'Name' },
                { key: 'relationship_type', title: 'Group' },
                { key: 'mobile_number', title: 'Mobile' }
            ];
        }
    }

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user);
        currentUserId = user?.id || null;
        
        if (!currentUserId) {
            console.error('No authenticated user found');
            return false;
        }
        return true;
    }

    async function loadContacts() {
        console.log('Loading contacts...');
        if (!await checkAuth()) return;

        console.log('Querying with user_id:', currentUserId);
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', currentUserId)
            .order('display_name');

        if (error) {
            console.error('Error loading contacts:', error);
            return;
        }

        console.log('Raw contacts data:', data);

        if (!data || data.length === 0) {
            console.log('No contacts found');
            return;
        }

        // Format the data for display
        tableSource = {
            ...tableSource,
            body: data.map(contact => ({
                id: contact.id,
                display_name: contact.display_name,
                relationship_type: formatRelationshipType(contact.relationship_type),
                mobile_number: formatPhoneNumber(contact.mobile_number),
                email_address: contact.email_address || '',
                birth_date: contact.birth_date ? new Date(contact.birth_date).toLocaleDateString() : '',
                last_contact_date: contact.last_contact_date ? new Date(contact.last_contact_date).toLocaleDateString() : ''
            }))
        };

        console.log('Formatted table data:', tableSource.body);
        
        // Process upcoming birthdays
        loadUpcomingBirthdays(data);
    }
    
    function loadUpcomingBirthdays(contacts) {
        // Filter contacts with birth dates and calculate days until next birthday
        const today = new Date();
        const contactsWithBirthdays = contacts
            .filter(contact => contact.birth_date)
            .map(contact => {
                const birthDate = new Date(contact.birth_date);
                const birthMonth = birthDate.getMonth();
                const birthDay = birthDate.getDate();
                
                // Calculate next birthday
                let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
                
                // If birthday has already occurred this year, set for next year
                if (nextBirthday < today) {
                    nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
                }
                
                // Calculate days until birthday
                const diffTime = nextBirthday.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return {
                    ...contact,
                    nextBirthday,
                    daysUntil: diffDays
                };
            })
            // Filter for birthdays in the next 30 days
            .filter(contact => contact.daysUntil <= 30)
            // Sort by days until birthday (ascending)
            .sort((a, b) => a.daysUntil - b.daysUntil);
        
        // Update the upcoming birthdays table source
        upcomingBirthdaysSource = {
            ...upcomingBirthdaysSource,
            body: contactsWithBirthdays.map(contact => ({
                id: contact.id,
                display_name: contact.display_name,
                relationship_type: formatRelationshipType(contact.relationship_type),
                birth_date: new Date(contact.birth_date).toLocaleDateString(),
                days_until: `${contact.daysUntil} day${contact.daysUntil === 1 ? '' : 's'}`
            }))
        };
    }

    function formatRelationshipType(type: string) {
        return type.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    function formatPhoneNumber(phone: string) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{1})?(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            const [, countryCode, area, prefix, line] = match;
            if (countryCode) {
                return `+${countryCode} (${area}) ${prefix}-${line}`;
            }
            return `(${area}) ${prefix}-${line}`;
        }
        return phone;
    }

    async function saveContact(newContact: any) {
        if (!currentUserId) return;
        
        console.log('Saving contact:', newContact);
        const { data, error } = await supabase
            .from('contacts')
            .insert([{
                ...newContact,
                user_id: currentUserId
            }]);

        if (error) {
            console.error('Error saving contact:', error);
            return;
        }

        console.log('Contact saved:', data);
        loadContacts();
    }

    async function updateContact(updatedContact: any) {
        if (!currentUserId) return;
        
        console.log('Updating contact:', updatedContact);
        const { data, error } = await supabase
            .from('contacts')
            .update({
                ...updatedContact,
                updated_at: new Date().toISOString()
            })
            .eq('id', updatedContact.id);

        if (error) {
            console.error('Error updating contact:', error);
            return;
        }

        console.log('Contact updated:', data);
        loadContacts();
    }

    function openAddContactModal() {
        const modal = {
            type: 'component',
            component: {
                ref: AddContactForm,
                props: {
                    parent: {
                        onSubmit: saveContact
                    }
                }
            }
        };
        modalStore.trigger(modal);
    }

    function openEditContactModal(contact: any) {
        const modal = {
            type: 'component',
            component: {
                ref: EditContactForm,
                props: {
                    parent: {
                        onUpdate: updateContact
                    },
                    contact: contact
                }
            }
        };
        modalStore.trigger(modal);
    }

    onMount(async () => {
        await checkAuth();
        await loadContacts();
    });
</script>

<div class="container h-full mx-auto p-4 space-y-4">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 class="h2">Personal Relationships</h2>
            <p class="text-sm opacity-75">Manage your contacts and track interactions</p>
        </div>
        <button class="btn variant-filled-primary" on:click={openAddContactModal}>
            Add Contact
        </button>
    </div>

    <!-- Auth Status -->
    {#if !currentUserId}
        <div class="alert variant-filled-warning">
            <p>Please sign in to view and manage your contacts.</p>
        </div>
    {:else}
        <!-- Upcoming Birthdays Section -->
        <div class="card p-4 mb-6">
            <h3 class="h3 mb-4">Upcoming Birthdays</h3>
            {#if upcomingBirthdaysSource.body.length === 0}
                <p class="text-center p-4">No upcoming birthdays in the next 30 days.</p>
            {:else}
                <div class="overflow-x-auto">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Group</th>
                                <th>Birth Date</th>
                                <th>Days Until</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each upcomingBirthdaysSource.body as contact}
                                <tr 
                                    class="hover:variant-soft-primary cursor-pointer"
                                    on:click={() => openEditContactModal(contact)}
                                    on:keypress={(e) => e.key === 'Enter' && openEditContactModal(contact)}
                                    tabindex="0"
                                    role="button"
                                >
                                    <td>{contact.display_name}</td>
                                    <td>{contact.relationship_type}</td>
                                    <td>{contact.birth_date}</td>
                                    <td class="font-semibold">{contact.days_until}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
        
        <!-- All Contacts Section -->
        <h3 class="h3 mb-4">All Contacts</h3>
        {#if tableSource.body.length === 0}
            <div class="card p-8 text-center">
                <p>No contacts found. Add your first contact using the button above.</p>
            </div>
        {:else}
            <div class="card p-4 overflow-x-auto">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Group</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>Birth Date</th>
                            <th>Last Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each tableSource.body as contact}
                            <tr 
                                class="hover:variant-soft-primary cursor-pointer"
                                on:click={() => openEditContactModal(contact)}
                                on:keypress={(e) => e.key === 'Enter' && openEditContactModal(contact)}
                                tabindex="0"
                                role="button"
                            >
                                <td>{contact.display_name}</td>
                                <td>{contact.relationship_type}</td>
                                <td>{contact.mobile_number}</td>
                                <td>{contact.email_address}</td>
                                <td>{contact.birth_date}</td>
                                <td>{contact.last_contact_date}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>
