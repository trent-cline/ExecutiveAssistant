<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import AuthGuard from '$lib/components/AuthGuard.svelte';

    interface SprinklerZone {
        id: string;
        name: string;
        description: string;
        location: string;
        plants: string[];
        last_watered: string | null;
        watering_schedule: string;
        notes: string;
    }

    let zones: SprinklerZone[] = [];
    let loading = true;
    let error = '';

    onMount(async () => {
        await loadZones();
    });

    async function loadZones() {
        try {
            loading = true;
            
            // Placeholder data - in a real app, you would fetch from Supabase
            zones = [
                {
                    id: '1',
                    name: 'Front Yard',
                    description: 'Front lawn and flower beds',
                    location: 'Front of house',
                    plants: ['Grass', 'Tulips', 'Daffodils'],
                    last_watered: new Date().toISOString(),
                    watering_schedule: 'Every 2 days, 6:00 AM',
                    notes: 'Needs extra water during summer months'
                },
                {
                    id: '2',
                    name: 'Backyard',
                    description: 'Back lawn area',
                    location: 'Behind house',
                    plants: ['Grass', 'Shrubs'],
                    last_watered: new Date().toISOString(),
                    watering_schedule: 'Every 3 days, 5:30 AM',
                    notes: 'Shaded area needs less water'
                },
                {
                    id: '3',
                    name: 'Garden Beds',
                    description: 'Vegetable and herb garden',
                    location: 'East side of house',
                    plants: ['Tomatoes', 'Basil', 'Peppers'],
                    last_watered: new Date().toISOString(),
                    watering_schedule: 'Daily, 7:00 AM',
                    notes: 'Drip irrigation system'
                },
                {
                    id: '4',
                    name: 'Side Yard',
                    description: 'Side yard with shrubs',
                    location: 'West side of house',
                    plants: ['Shrubs', 'Ornamental grass'],
                    last_watered: new Date().toISOString(),
                    watering_schedule: 'Every 4 days, 6:30 AM',
                    notes: 'Check for leaks in this zone'
                },
                {
                    id: '5',
                    name: 'Flower Garden',
                    description: 'Perennial flower garden',
                    location: 'South side of house',
                    plants: ['Roses', 'Lilies', 'Dahlias'],
                    last_watered: new Date().toISOString(),
                    watering_schedule: 'Every 2 days, 6:15 AM',
                    notes: 'Adjust during blooming season'
                },
                {
                    id: '6',
                    name: 'Patio Plants',
                    description: 'Potted plants around patio',
                    location: 'Patio area',
                    plants: ['Ferns', 'Succulents', 'Herbs'],
                    last_watered: new Date().toISOString(),
                    watering_schedule: 'Daily, 7:30 AM',
                    notes: 'Hand water if needed during hot days'
                },
                {
                    id: '7',
                    name: 'Driveway Border',
                    description: 'Plants along driveway',
                    location: 'Driveway perimeter',
                    plants: ['Lavender', 'Ornamental grasses'],
                    last_watered: new Date().toISOString(),
                    watering_schedule: 'Every 3 days, 6:45 AM',
                    notes: 'Low water needs'
                }
            ];
        } catch (e) {
            console.error('Error loading sprinkler zones:', e);
            error = e instanceof Error ? e.message : 'Failed to load zones';
        } finally {
            loading = false;
        }
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
</script>

<AuthGuard>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">Sprinkler Zones</h1>
                <p class="text-gray-600">Manage your 7 sprinkler zones</p>
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
                <p>Loading sprinkler zones...</p>
            </div>
        {:else if error}
            <div class="error-message">
                <p>{error}</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each zones as zone}
                    <div class="zone-card">
                        <div class="zone-header" style="background-color: hsl({parseInt(zone.id) * 50}, 70%, 60%)">
                            <h2>{zone.name}</h2>
                            <span class="zone-badge">Zone {zone.id}</span>
                        </div>
                        <div class="zone-content">
                            <p class="zone-description">{zone.description}</p>
                            <div class="zone-details">
                                <div class="detail-item">
                                    <span class="detail-label">Location:</span>
                                    <span>{zone.location}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Plants:</span>
                                    <span>{zone.plants.join(', ')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Last Watered:</span>
                                    <span>{formatDate(zone.last_watered)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Schedule:</span>
                                    <span>{zone.watering_schedule}</span>
                                </div>
                                {#if zone.notes}
                                    <div class="detail-item notes">
                                        <span class="detail-label">Notes:</span>
                                        <span>{zone.notes}</span>
                                    </div>
                                {/if}
                            </div>
                            <div class="zone-actions">
                                <button class="water-now-btn">
                                    <i class="fas fa-tint mr-2"></i>
                                    Water Now
                                </button>
                                <button class="edit-btn">
                                    <i class="fas fa-edit mr-2"></i>
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
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

    .zone-card {
        background-color: white;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .zone-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }

    .zone-header {
        padding: 1rem;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .zone-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
    }

    .zone-badge {
        background-color: rgba(255, 255, 255, 0.3);
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .zone-content {
        padding: 1rem;
    }

    .zone-description {
        color: #4b5563;
        margin-bottom: 1rem;
    }

    .zone-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
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

    .notes {
        padding-top: 0.5rem;
        border-top: 1px dashed #e5e7eb;
    }

    .zone-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .water-now-btn {
        flex: 1;
        background-color: #3b82f6;
        color: white;
        padding: 0.5rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }

    .water-now-btn:hover {
        background-color: #2563eb;
    }

    .edit-btn {
        background-color: #e5e7eb;
        color: #4b5563;
        padding: 0.5rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }

    .edit-btn:hover {
        background-color: #d1d5db;
    }
</style>
