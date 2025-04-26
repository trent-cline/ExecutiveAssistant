<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import AuthGuard from '$lib/components/AuthGuard.svelte';

    interface BreakerCircuit {
        id: string;
        number: string;
        description: string;
        amperage: number;
        rooms: string[];
        notes: string;
        status: 'on' | 'off' | 'tripped';
    }

    let circuits: BreakerCircuit[] = [];
    let loading = true;
    let error = '';

    onMount(async () => {
        await loadCircuits();
    });

    async function loadCircuits() {
        try {
            loading = true;
            
            // Placeholder data - in a real app, you would fetch from Supabase
            circuits = [
                {
                    id: '1',
                    number: '1',
                    description: 'Main Living Room',
                    amperage: 15,
                    rooms: ['Living Room'],
                    notes: 'Controls ceiling lights and north wall outlets',
                    status: 'on'
                },
                {
                    id: '2',
                    number: '2',
                    description: 'Kitchen Appliances',
                    amperage: 20,
                    rooms: ['Kitchen'],
                    notes: 'Refrigerator, dishwasher, and disposal',
                    status: 'on'
                },
                {
                    id: '3',
                    number: '3',
                    description: 'Kitchen Outlets',
                    amperage: 20,
                    rooms: ['Kitchen'],
                    notes: 'Counter outlets and microwave',
                    status: 'on'
                },
                {
                    id: '4',
                    number: '4',
                    description: 'Master Bedroom',
                    amperage: 15,
                    rooms: ['Master Bedroom', 'Master Bathroom'],
                    notes: 'All outlets and lights',
                    status: 'on'
                },
                {
                    id: '5',
                    number: '5',
                    description: 'Bedrooms 2 & 3',
                    amperage: 15,
                    rooms: ['Bedroom 2', 'Bedroom 3'],
                    notes: 'All outlets and overhead lights',
                    status: 'on'
                },
                {
                    id: '6',
                    number: '6',
                    description: 'Bathrooms',
                    amperage: 20,
                    rooms: ['Hall Bathroom', 'Guest Bathroom'],
                    notes: 'GFCI outlets and lights',
                    status: 'on'
                },
                {
                    id: '7',
                    number: '7',
                    description: 'Laundry Room',
                    amperage: 30,
                    rooms: ['Laundry Room'],
                    notes: 'Washer and dryer',
                    status: 'on'
                },
                {
                    id: '8',
                    number: '8',
                    description: 'Garage',
                    amperage: 20,
                    rooms: ['Garage'],
                    notes: 'Garage door opener and outlets',
                    status: 'on'
                },
                {
                    id: '9',
                    number: '9',
                    description: 'Outside Lights',
                    amperage: 15,
                    rooms: ['Exterior'],
                    notes: 'Porch, patio, and security lights',
                    status: 'on'
                },
                {
                    id: '10',
                    number: '10',
                    description: 'HVAC System',
                    amperage: 30,
                    rooms: ['Utility Room'],
                    notes: 'Heating and air conditioning',
                    status: 'on'
                },
                {
                    id: '11',
                    number: '11',
                    description: 'Water Heater',
                    amperage: 30,
                    rooms: ['Utility Room'],
                    notes: 'Electric water heater',
                    status: 'on'
                },
                {
                    id: '12',
                    number: '12',
                    description: 'Basement',
                    amperage: 20,
                    rooms: ['Basement'],
                    notes: 'All basement outlets and lights',
                    status: 'off'
                }
            ];
        } catch (e) {
            console.error('Error loading breaker circuits:', e);
            error = e instanceof Error ? e.message : 'Failed to load circuits';
        } finally {
            loading = false;
        }
    }

    function toggleCircuit(id: string) {
        circuits = circuits.map(circuit => {
            if (circuit.id === id) {
                return {
                    ...circuit,
                    status: circuit.status === 'on' ? 'off' : 'on'
                };
            }
            return circuit;
        });
    }
</script>

<AuthGuard>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">Breaker Box</h1>
                <p class="text-gray-600">Manage your electrical circuits</p>
            </div>
            <div class="flex gap-3">
                <a href="/home-systems" class="btn btn-secondary">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Home Systems
                </a>
            </div>
        </div>

        {#if loading}
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading breaker circuits...</p>
            </div>
        {:else if error}
            <div class="error-message">
                <p>{error}</p>
            </div>
        {:else}
            <div class="breaker-box">
                <div class="breaker-box-header">
                    <h2>Main Electrical Panel</h2>
                    <div class="main-switch">
                        <span>Main Switch</span>
                        <div class="switch on">ON</div>
                    </div>
                </div>
                <div class="breaker-grid">
                    {#each circuits as circuit}
                        <div class="circuit-card">
                            <div class="circuit-header">
                                <div class="circuit-number">#{circuit.number}</div>
                                <div class="circuit-amperage">{circuit.amperage}A</div>
                                <div class="switch-container">
                                    <button 
                                        class="switch {circuit.status}" 
                                        on:click={() => toggleCircuit(circuit.id)}
                                        aria-label="Toggle circuit {circuit.number}"
                                    >
                                        {circuit.status.toUpperCase()}
                                    </button>
                                </div>
                            </div>
                            <div class="circuit-content">
                                <h3>{circuit.description}</h3>
                                <div class="circuit-details">
                                    <div class="detail-item">
                                        <span class="detail-label">Rooms:</span>
                                        <span>{circuit.rooms.join(', ')}</span>
                                    </div>
                                    {#if circuit.notes}
                                        <div class="detail-item">
                                            <span class="detail-label">Notes:</span>
                                            <span>{circuit.notes}</span>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</AuthGuard>

<style>
    .container {
        max-width: 1400px;
    }

    .btn {
        @apply px-4 py-2 rounded font-medium transition-colors duration-200;
    }

    .btn-secondary {
        @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
    }

    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid #3498db;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-message {
        background-color: #fee2e2;
        color: #b91c1c;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .breaker-box {
        background-color: #f3f4f6;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .breaker-box-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e5e7eb;
    }

    .breaker-box-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
    }

    .main-switch {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .main-switch span {
        font-weight: 600;
        color: #4b5563;
    }

    .switch {
        background-color: #ef4444;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 0.2s ease;
        min-width: 60px;
        text-align: center;
        border: none;
    }

    .switch.on {
        background-color: #10b981;
    }

    .switch.off {
        background-color: #ef4444;
    }

    .switch.tripped {
        background-color: #f59e0b;
        animation: blink 1s infinite;
    }

    @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .breaker-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .circuit-card {
        background-color: white;
        border-radius: 0.375rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .circuit-header {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        background-color: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .circuit-number {
        font-weight: 700;
        color: #1f2937;
        min-width: 40px;
    }

    .circuit-amperage {
        font-size: 0.875rem;
        color: #6b7280;
        margin-right: auto;
    }

    .switch-container {
        margin-left: auto;
    }

    .circuit-content {
        padding: 1rem;
    }

    .circuit-content h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .circuit-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        font-size: 0.875rem;
    }

    .detail-label {
        font-weight: 600;
        color: #6b7280;
    }
</style>
