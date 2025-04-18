<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    
    // Components that will be created
    import TeamMember from './TeamMember.svelte';
    import CreateMeetingModal from './CreateMeetingModal.svelte';
    import MeetingDetails from './MeetingDetails.svelte';
    
    // State variables
    let employees: any[] = [];
    let meetings: any[] = [];
    let showCreateMeetingModal = false;
    let selectedMeeting: any = null;
    let loading = true;
    let error: string | null = null;
    
    onMount(async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
            goto('/login');
            return;
        }
        
        await Promise.all([
            loadEmployees(),
            loadMeetings()
        ]);
    });
    
    async function loadEmployees() {
        try {
            const { data, error: err } = await supabase
                .from('organization_employees')
                .select('*')
                .order('name');
                
            if (err) throw err;
            
            employees = data || [];
        } catch (err: any) {
            console.error('Error loading employees:', err);
            error = err.message;
        }
    }
    
    async function loadMeetings() {
        try {
            const { data, error: err } = await supabase
                .from('team_meetings')
                .select(`
                    *,
                    participants:team_meeting_participants(
                        *,
                        employee:organization_employees(*)
                    )
                `)
                .order('meeting_date', { ascending: false });
                
            if (err) throw err;
            
            meetings = data || [];
        } catch (err: any) {
            console.error('Error loading meetings:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }
    
    async function handleCreateMeeting(event: CustomEvent) {
        try {
            const meetingData = event.detail;
            
            // First create the meeting
            const { data: meeting, error: meetingError } = await supabase
                .from('team_meetings')
                .insert([{
                    title: meetingData.title,
                    description: meetingData.description,
                    meeting_date: meetingData.meetingDate,
                    status: 'scheduled',
                    pre_meeting_summary: meetingData.objectives || ''
                }])
                .select()
                .single();
                
            if (meetingError) throw meetingError;
            
            // Then add participants
            const participantInserts = meetingData.participants.map((empId: string) => ({
                meeting_id: meeting.id,
                employee_id: empId,
                objectives: meetingData.employeeObjectives[empId] || '',
                conclusions: ''
            }));
            
            const { error: participantsError } = await supabase
                .from('team_meeting_participants')
                .insert(participantInserts);
                
            if (participantsError) throw participantsError;
            
            // Reload meetings to get the updated list with participants
            await loadMeetings();
            showCreateMeetingModal = false;
        } catch (err: any) {
            console.error('Error creating meeting:', err);
            error = err.message;
        }
    }
    
    async function handleGenerateAISummary(meetingId: string, type: 'pre' | 'post') {
        try {
            const meeting = meetings.find(m => m.id === meetingId);
            if (!meeting) throw new Error('Meeting not found');
            
            // In a real implementation, this would call an API endpoint
            // that would use OpenAI to generate the summary
            const summary = type === 'pre' 
                ? `AI-generated pre-meeting summary for ${meeting.title}. This would include objectives and context based on participant roles and past meetings.`
                : `AI-generated post-meeting summary for ${meeting.title}. This would include conclusions, action items, and next steps for each participant.`;
            
            const { error: updateError } = await supabase
                .from('team_meetings')
                .update({
                    [type === 'pre' ? 'pre_meeting_summary' : 'post_meeting_summary']: summary
                })
                .eq('id', meetingId);
                
            if (updateError) throw updateError;
            
            await loadMeetings();
            
            // If this is the selected meeting, update it
            if (selectedMeeting?.id === meetingId) {
                selectedMeeting = meetings.find(m => m.id === meetingId);
            }
        } catch (err: any) {
            console.error(`Error generating ${type} meeting summary:`, err);
            error = err.message;
        }
    }
    
    function selectMeeting(meeting: any) {
        selectedMeeting = meeting;
    }
    
    function handleCloseDetails() {
        selectedMeeting = null;
    }
</script>

<div class="team-page">
    <div class="header">
        <h1>Team Meetings</h1>
        <button class="create-button" on:click={() => showCreateMeetingModal = true}>
            Create Meeting
        </button>
    </div>
    
    {#if error}
        <div class="error" role="alert">
            <p>{error}</p>
            <button 
                class="close-error" 
                on:click={() => error = null}
                aria-label="Dismiss error"
            >
                ×
            </button>
        </div>
    {/if}
    
    {#if loading}
        <div class="loading" role="status">
            <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading team data...</span>
        </div>
    {:else}
        <div class="content">
            {#if selectedMeeting}
                <MeetingDetails 
                    meeting={selectedMeeting} 
                    on:close={handleCloseDetails}
                    on:generateSummary={(e) => handleGenerateAISummary(selectedMeeting.id, e.detail.type)}
                />
            {:else}
                <div class="meetings-list">
                    {#if meetings.length === 0}
                        <div class="empty-state">
                            <p>No meetings found. Click "Create Meeting" to schedule your first team meeting.</p>
                        </div>
                    {:else}
                        {#each meetings as meeting}
                            <div class="meeting-card" on:click={() => selectMeeting(meeting)}>
                                <h3>{meeting.title}</h3>
                                <div class="meeting-date">
                                    {new Date(meeting.meeting_date).toLocaleDateString()}
                                </div>
                                <div class="meeting-status {meeting.status}">
                                    {meeting.status}
                                </div>
                                <div class="meeting-participants">
                                    {#if meeting.participants && meeting.participants.length > 0}
                                        <div class="participant-avatars">
                                            {#each meeting.participants.slice(0, 4) as participant}
                                                <div class="participant-avatar" title={participant.employee?.name || 'Unknown'}>
                                                    {participant.employee?.name?.charAt(0) || '?'}
                                                </div>
                                            {/each}
                                            {#if meeting.participants.length > 4}
                                                <div class="participant-avatar more">
                                                    +{meeting.participants.length - 4}
                                                </div>
                                            {/if}
                                        </div>
                                    {:else}
                                        <span class="no-participants">No participants</span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>

<CreateMeetingModal
    show={showCreateMeetingModal}
    {employees}
    on:create={handleCreateMeeting}
    on:close={() => showCreateMeetingModal = false}
/>

<style>
    .team-page {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    h1 {
        font-size: 1.875rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
    }
    
    .create-button {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .create-button:hover {
        background: var(--surface-4, #2563eb);
    }
    
    .error {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #fee2e2;
        border: 1px solid #ef4444;
        border-radius: 0.375rem;
        color: #991b1b;
        margin-bottom: 1rem;
    }
    
    .error p {
        margin: 0;
    }
    
    .close-error {
        background: none;
        border: none;
        color: #991b1b;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
    }
    
    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.75rem;
        height: 100%;
        color: var(--text-2, #6b7280);
    }
    
    .content {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }
    
    .empty-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: var(--text-2, #6b7280);
        text-align: center;
        padding: 2rem;
    }
    
    .meetings-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .meeting-card {
        background: var(--surface-1, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        padding: 1.25rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .meeting-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .meeting-card h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.75rem 0;
        color: var(--text-1, #111827);
    }
    
    .meeting-date {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        margin-bottom: 0.5rem;
    }
    
    .meeting-status {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 500;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        margin-bottom: 0.75rem;
    }
    
    .meeting-status.scheduled {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .meeting-status.completed {
        background: #dcfce7;
        color: #166534;
    }
    
    .meeting-status.cancelled {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .meeting-participants {
        margin-top: 0.75rem;
    }
    
    .participant-avatars {
        display: flex;
        margin-left: 0.25rem;
    }
    
    .participant-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 9999px;
        background: var(--surface-3, #3b82f6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        margin-left: -0.25rem;
        border: 2px solid var(--surface-1, #ffffff);
    }
    
    .participant-avatar.more {
        background: var(--surface-2, #e5e7eb);
        color: var(--text-2, #6b7280);
    }
    
    .no-participants {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        font-style: italic;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .error {
            background: #7f1d1d;
            border-color: #b91c1c;
            color: #fee2e2;
        }
        
        .close-error {
            color: #fee2e2;
        }
        
        .meeting-card {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
        }
        
        .meeting-status.scheduled {
            background: #1e3a8a;
            color: #bfdbfe;
        }
        
        .meeting-status.completed {
            background: #14532d;
            color: #bbf7d0;
        }
        
        .meeting-status.cancelled {
            background: #7f1d1d;
            color: #fecaca;
        }
        
        .participant-avatar {
            border-color: var(--surface-1, #1f2937);
        }
    }
</style>
