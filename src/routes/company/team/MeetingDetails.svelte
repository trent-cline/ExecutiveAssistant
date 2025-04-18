<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import MeetingRoom from './MeetingRoom.svelte';
    
    export let meeting: any;
    
    const dispatch = createEventDispatcher();
    
    let editingParticipant: any = null;
    let participantObjectives = '';
    let participantConclusions = '';
    let error: string | null = null;
    let showMeetingRoom = false;
    let isGeneratingSummary = false;
    let isGeneratingActionItems = false;
    let showTranscript = false;
    
    onMount(async () => {
        // If meeting is completed but has no post-meeting summary, fetch the transcript
        if (meeting.status === 'completed' && !meeting.post_meeting_summary) {
            await fetchMeetingData();
        }
    });
    
    async function fetchMeetingData() {
        try {
            const { data, error: fetchError } = await supabase
                .from('team_meetings')
                .select('*')
                .eq('id', meeting.id)
                .single();
                
            if (fetchError) throw fetchError;
            
            // Update local meeting data
            if (data) {
                meeting = { ...meeting, ...data };
            }
        } catch (err: any) {
            console.error('Error fetching meeting data:', err);
            error = err.message;
        }
    }
    
    function handleClose() {
        dispatch('close');
    }
    
    function startMeeting() {
        showMeetingRoom = true;
        // Update meeting status to in-progress
        updateMeetingStatus('in-progress');
    }
    
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function formatDuration(startDate: Date, endDate: Date) {
        const durationMs = endDate.getTime() - startDate.getTime();
        const minutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
        } else {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }
    
    function startEditParticipant(participant: any) {
        editingParticipant = participant;
        participantObjectives = participant.objectives || '';
        participantConclusions = participant.conclusions || '';
    }
    
    function cancelEditParticipant() {
        editingParticipant = null;
        participantObjectives = '';
        participantConclusions = '';
    }
    
    async function saveParticipantChanges() {
        if (!editingParticipant) return;
        
        try {
            const { error: err } = await supabase
                .from('team_meeting_participants')
                .update({
                    objectives: participantObjectives,
                    conclusions: participantConclusions
                })
                .eq('id', editingParticipant.id);
                
            if (err) throw err;
            
            // Update the local state
            meeting.participants = meeting.participants.map((p: any) => 
                p.id === editingParticipant.id 
                    ? { ...p, objectives: participantObjectives, conclusions: participantConclusions } 
                    : p
            );
            
            cancelEditParticipant();
        } catch (err: any) {
            console.error('Error updating participant:', err);
            error = err.message;
        }
    }
    
    async function updateMeetingStatus(status: string) {
        try {
            const { error: err } = await supabase
                .from('team_meetings')
                .update({ status })
                .eq('id', meeting.id);
                
            if (err) throw err;
            
            // Update the local state
            meeting.status = status;
        } catch (err: any) {
            console.error('Error updating meeting status:', err);
            error = err.message;
        }
    }
    
    async function generateAISummary(type: 'pre' | 'post') {
        if (isGeneratingSummary) return;
        isGeneratingSummary = true;
        
        try {
            if (type === 'pre') {
                // For pre-meeting summary, create a more comprehensive context
                const objectives = meeting.participants
                    .map((p: any) => `${p.employee.name} (${p.employee.title}): ${p.objectives || 'No specific objectives'}`)
                    .join('\n');
                
                // Create a structured pre-meeting summary with context
                const meetingContext = `
# Pre-Meeting Summary: ${meeting.title}

## Meeting Context
${meeting.description || 'No description provided.'}

## Date and Time
${formatDate(meeting.meeting_date)}

## Expected Participants
${meeting.participants.map((p: any) => `- ${p.employee.name} (${p.employee.title})`).join('\n')}

## Participant Objectives
${objectives}

## Agenda Items
1. Introduction and meeting goals
2. Discussion of key topics
3. Decision making and action items
4. Next steps and follow-up assignments

## Preparation Materials
- Review previous meeting notes if applicable
- Come prepared with updates on assigned tasks
- Be ready to discuss challenges and proposed solutions
`;
                
                // First save the basic meeting summary
                await updateMeetingSummary(type, meetingContext);
                
                // Then enrich it with background information from the web
                try {
                    // Extract key topics from the meeting title and description
                    const keyTopics = extractKeyTopics(meeting.title, meeting.description);
                    
                    // Call the server endpoint to generate background information
                    const response = await fetch('/api/meeting', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'generateBackgroundInfo',
                            data: {
                                title: meeting.title,
                                description: meeting.description,
                                keyTopics: keyTopics
                            }
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to generate background information');
                    }
                    
                    const backgroundInfo = await response.json();
                    
                    // Create an enriched meeting summary with background information
                    const enrichedSummary = `${meetingContext}

## Background Information
${backgroundInfo.content}

## Key Concepts
${backgroundInfo.keyConcepts.map((concept: any) => `### ${concept.name}\n${concept.description}`).join('\n\n')}

## Industry Trends
${backgroundInfo.trends.map((trend: string) => `- ${trend}`).join('\n')}

## Relevant Resources
${backgroundInfo.resources.map((resource: any) => `- [${resource.title}](${resource.url})`).join('\n')}
`;
                    
                    // Update the meeting summary with the enriched version
                    await updateMeetingSummary(type, enrichedSummary);
                } catch (bgError: any) {
                    console.error('Error enriching meeting summary with background info:', bgError);
                    // We don't throw here to avoid failing the entire process
                    // The basic summary is still saved
                }
            } else {
                // For post-meeting summary, use the transcript
                if (!meeting.transcript) {
                    await fetchMeetingData();
                }
                
                if (!meeting.transcript) {
                    throw new Error('No transcript available for this meeting');
                }
                
                // Call the server endpoint to generate a summary
                const response = await fetch('/api/meeting', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'generateSummary',
                        data: {
                            transcript: meeting.transcript,
                            title: meeting.title,
                            description: meeting.description || ''
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to generate meeting summary');
                }
                
                const summaryResult = await response.json();
                
                const formattedSummary = `
# Post-Meeting Summary: ${meeting.title}

## Meeting Date
${formatDate(meeting.meeting_date)}

## Participants
${meeting.participants.map((p: any) => `- ${p.employee.name} (${p.employee.title})`).join('\n')}

## Summary
${summaryResult.summary}

## Key Points Discussed
${summaryResult.keyPoints.map((point: string) => `- ${point}`).join('\n')}

## Decisions Made
${summaryResult.decisions.map((decision: string) => `- ${decision}`).join('\n')}

## Action Items
${summaryResult.actionItems.map((item: string) => `- ${item}`).join('\n')}

## Company Objectives Addressed
${summaryResult.companyObjectives.map((objective: string) => `- ${objective}`).join('\n')}

## Next Steps
- Schedule follow-up meetings as needed
- Track progress on assigned action items
- Share this summary with relevant stakeholders

## Meeting Duration
${meeting.completed_at ? formatDuration(new Date(meeting.meeting_date), new Date(meeting.completed_at)) : 'Not recorded'}
                `;
                
                await updateMeetingSummary(type, formattedSummary);
                await generateAndSaveActionItems();
            }
        } catch (err: any) {
            console.error(`Error generating ${type} meeting summary:`, err);
            error = err.message;
        } finally {
            isGeneratingSummary = false;
        }
    }
    
    async function updateMeetingSummary(type: 'pre' | 'post', summary: string) {
        try {
            const updateField = type === 'pre' ? 'pre_meeting_summary' : 'post_meeting_summary';
            
            const { error: updateError } = await supabase
                .from('team_meetings')
                .update({ [updateField]: summary })
                .eq('id', meeting.id);
                
            if (updateError) throw updateError;
            
            // Update local state
            meeting[updateField] = summary;
        } catch (err: any) {
            console.error('Error updating meeting summary:', err);
            throw err;
        }
    }
    
    async function generateAndSaveActionItems() {
        if (isGeneratingActionItems || !meeting.transcript) return;
        isGeneratingActionItems = true;
        
        try {
            // Call the server endpoint to generate action items
            const response = await fetch('/api/meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'generateActionItems',
                    data: {
                        transcript: meeting.transcript,
                        participants: meeting.participants
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate action items');
            }
            
            const actionItems = await response.json();
            
            // Update each participant with their action items
            for (const participant of actionItems) {
                const formattedConclusions = `
                    Conclusions:\n${participant.conclusions}\n\n
                    Action Items:\n
                    ${participant.actionItems.map((item: string) => `- ${item}`).join('\n')}
                `;
                
                const { error: updateError } = await supabase
                    .from('team_meeting_participants')
                    .update({ conclusions: formattedConclusions })
                    .eq('id', participant.participantId);
                    
                if (updateError) throw updateError;
                
                // Update local state
                meeting.participants = meeting.participants.map((p: any) => 
                    p.id === participant.participantId 
                        ? { ...p, conclusions: formattedConclusions } 
                        : p
                );
            }
        } catch (err: any) {
            console.error('Error generating action items:', err);
            error = err.message;
        } finally {
            isGeneratingActionItems = false;
        }
    }
    
    function toggleTranscript() {
        showTranscript = !showTranscript;
    }
    
    function extractKeyTopics(title: string, description?: string): string[] {
        // Combine title and description
        const text = `${title} ${description || ''}`;
        
        // List of common filler words to exclude
        const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'meeting', 'discussion', 'review', 'update'];
        
        // Extract words, remove punctuation, and convert to lowercase
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/) // Split by whitespace
            .filter(word => word.length > 2 && !stopWords.includes(word)); // Filter out stop words and short words
        
        // Count word frequency
        const wordCount: Record<string, number> = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        // Sort by frequency and take top 5
        const sortedWords = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);
        
        return sortedWords;
    }
</script>

<div class="meeting-details">
    <div class="header">
        <button class="back-button" on:click={handleClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Meetings
        </button>
        
        <div class="meeting-actions">
            {#if meeting.status === 'scheduled'}
                <button class="start-meeting-button" on:click={startMeeting}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Start Meeting
                </button>
            {/if}
            
            <div class="meeting-status-controls">
                <span class="status-label">Status:</span>
                <div class="status-buttons">
                <button 
                    class="status-button {meeting.status === 'scheduled' ? 'active' : ''}" 
                    on:click={() => updateMeetingStatus('scheduled')}
                >
                    Scheduled
                </button>
                <button 
                    class="status-button {meeting.status === 'in-progress' ? 'active' : ''}" 
                    on:click={() => updateMeetingStatus('in-progress')}
                >
                    In Progress
                </button>
                <button 
                    class="status-button {meeting.status === 'completed' ? 'active' : ''}" 
                    on:click={() => updateMeetingStatus('completed')}
                >
                    Completed
                </button>
                <button 
                    class="status-button {meeting.status === 'cancelled' ? 'active' : ''}" 
                    on:click={() => updateMeetingStatus('cancelled')}
                >
                    Cancelled
                </button>
                </div>
            </div>
        </div>
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
    
    <div class="meeting-header">
        <h1>{meeting.title}</h1>
        <div class="meeting-date">{formatDate(meeting.meeting_date)}</div>
        <div class="meeting-description">{meeting.description || 'No description provided.'}</div>
    </div>
    
    <div class="meeting-content">
        <div class="meeting-section">
            <div class="section-header">
                <h2>Pre-Meeting Summary & Background</h2>
                <button class="ai-button" on:click={() => generateAISummary('pre')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg>
                    Generate AI Summary with Background
                </button>
            </div>
            <div class="summary-content">
                {#if meeting.pre_meeting_summary}
                    <div class="formatted-summary">
                        {#each meeting.pre_meeting_summary.split('\n') as line}
                            {#if line.trim().startsWith('#')}
                                <h3>{line.replace(/^#+\s*/, '')}</h3>
                            {:else if line.trim().startsWith('##')}
                                <h4>{line.replace(/^#+\s*/, '')}</h4>
                            {:else if line.trim().startsWith('-')}
                                <div class="list-item">{line}</div>
                            {:else if line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.') || line.trim().startsWith('5.')}
                                <div class="list-item">{line}</div>
                            {:else if line.trim()}
                                <p>{line}</p>
                            {/if}
                        {/each}
                    </div>
                {:else}
                    <p class="empty-content">No pre-meeting summary available. Click "Generate AI Summary" to create one based on participant objectives.</p>
                {/if}
            </div>
        </div>
        
        <div class="meeting-section">
            <h2>Participants</h2>
            
            <div class="participants-list">
                {#if meeting.participants && meeting.participants.length > 0}
                    {#each meeting.participants as participant}
                        {#if editingParticipant && editingParticipant.id === participant.id}
                            <div class="participant-edit-card">
                                <div class="participant-header">
                                    <div class="participant-avatar">
                                        {participant.employee?.name?.charAt(0) || '?'}
                                    </div>
                                    <div class="participant-name">
                                        {participant.employee?.name || 'Unknown'}
                                    </div>
                                    <div class="participant-title">
                                        {participant.employee?.title || 'No title'}
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="participant-objectives">Objectives</label>
                                    <textarea 
                                        id="participant-objectives" 
                                        bind:value={participantObjectives} 
                                        rows="3"
                                        placeholder="Enter objectives for this participant"
                                    ></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="participant-conclusions">Conclusions & Action Items</label>
                                    <textarea 
                                        id="participant-conclusions" 
                                        bind:value={participantConclusions} 
                                        rows="3"
                                        placeholder="Enter conclusions and action items for this participant"
                                    ></textarea>
                                </div>
                                
                                <div class="edit-actions">
                                    <button class="cancel-button" on:click={cancelEditParticipant}>Cancel</button>
                                    <button class="save-button" on:click={saveParticipantChanges}>Save Changes</button>
                                </div>
                            </div>
                        {:else}
                            <div class="participant-card">
                                <div class="participant-header">
                                    <div class="participant-avatar">
                                        {participant.employee?.name?.charAt(0) || '?'}
                                    </div>
                                    <div class="participant-info">
                                        <div class="participant-name">
                                            {participant.employee?.name || 'Unknown'}
                                        </div>
                                        <div class="participant-title">
                                            {participant.employee?.title || 'No title'}
                                        </div>
                                    </div>
                                    <button class="edit-button" on:click={() => startEditParticipant(participant)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                </div>
                                
                                <div class="participant-content">
                                    <div class="content-section">
                                        <h4>Objectives</h4>
                                        <p>{participant.objectives || 'No objectives set.'}</p>
                                    </div>
                                    
                                    <div class="content-section">
                                        <h4>Conclusions & Action Items</h4>
                                        <p>{participant.conclusions || 'No conclusions or action items yet.'}</p>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/each}
                {:else}
                    <div class="empty-state">
                        <p>No participants added to this meeting.</p>
                    </div>
                {/if}
            </div>
        </div>
        
        {#if meeting.status === 'completed' || meeting.status === 'in-progress'}
            <div class="meeting-section">
                <div class="section-header">
                    <h2>Post-Meeting Summary</h2>
                    <button class="ai-button" on:click={() => generateAISummary('post')} disabled={isGeneratingSummary}>
                        {#if isGeneratingSummary}
                            <div class="spinner"></div>
                            Generating...
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                            </svg>
                            Generate AI Summary
                        {/if}
                    </button>
                </div>
                <div class="summary-content">
                    {#if meeting.post_meeting_summary}
                        <div class="formatted-summary">
                            {#each meeting.post_meeting_summary.split('\n') as line}
                                {#if line.trim().startsWith('#')}
                                    <h3>{line.replace(/^#+\s*/, '')}</h3>
                                {:else if line.trim().startsWith('##')}
                                    <h4>{line.replace(/^#+\s*/, '')}</h4>
                                {:else if line.trim().startsWith('-')}
                                    <div class="list-item">{line}</div>
                                {:else if line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.') || line.trim().startsWith('5.')}
                                    <div class="list-item">{line}</div>
                                {:else if line.trim()}
                                    <p>{line}</p>
                                {/if}
                            {/each}
                        </div>
                    {:else}
                        <p class="empty-content">No post-meeting summary available. Click "Generate AI Summary" to create one based on the meeting transcript.</p>
                    {/if}
                </div>
            </div>
            
            <!-- Transcript Section -->
            {#if meeting.transcript}
                <div class="meeting-section">
                    <div class="section-header">
                        <h2>Meeting Transcript</h2>
                        <button class="toggle-button" on:click={toggleTranscript}>
                            {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                        </button>
                    </div>
                    {#if showTranscript}
                        <div class="transcript-content">
                            <pre>{meeting.transcript}</pre>
                        </div>
                    {/if}
                </div>
            {/if}
        {/if}
        

    </div>
</div>

{#if showMeetingRoom}
    <div class="meeting-room-overlay">
        <MeetingRoom 
            {meeting}
            participants={meeting.participants || []}
            on:close={() => {
                showMeetingRoom = false;
                fetchMeetingData(); // Refresh meeting data when closing the room
            }}
            on:generateSummary={async (event) => {
                if (event.detail.type === 'post' && event.detail.transcript) {
                    // Update meeting with transcript
                    meeting.transcript = event.detail.transcript;
                    // Generate summary
                    await generateAISummary('post');
                }
            }}
        />
    </div>
{/if}

<style>
    .meeting-details {
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    
    .spinner {
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top: 2px solid #3498db;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: none;
        border: none;
        color: var(--text-2, #6b7280);
        font-weight: 500;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .back-button:hover {
        color: var(--text-1, #111827);
    }
    
    .meeting-status-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .status-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-2, #6b7280);
    }
    
    .status-buttons {
        display: flex;
        gap: 0.25rem;
    }
    
    .status-button {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        border: 1px solid var(--border-color, #e5e7eb);
        background: var(--surface-1, #ffffff);
        color: var(--text-2, #6b7280);
        border-radius: 9999px;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    }
    
    .status-button.active {
        background: var(--surface-3, #3b82f6);
        color: white;
        border-color: var(--surface-3, #3b82f6);
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
    
    .meeting-header {
        margin-bottom: 1.5rem;
    }
    
    .meeting-header h1 {
        font-size: 1.875rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: var(--text-1, #111827);
    }
    
    .meeting-date {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        margin-bottom: 0.5rem;
    }
    
    .meeting-description {
        color: var(--text-1, #111827);
        line-height: 1.5;
    }
    
    .meeting-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    
    .meeting-section {
        background: var(--surface-1, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        padding: 1.5rem;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .meeting-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
        color: var(--text-1, #111827);
    }
    
    .ai-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: var(--surface-2, #f3f4f6);
        color: var(--text-2, #6b7280);
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .ai-button:hover {
        background-color: #2563eb;
    }
    
    .ai-button:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
    }
    
    .toggle-button {
        padding: 0.5rem 1rem;
        background-color: #e5e7eb;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .toggle-button:hover {
        background-color: #d1d5db;
    }
    
    .transcript-content {
        background-color: #f9fafb;
        border-radius: 0.375rem;
        padding: 1rem;
        margin-top: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 0.875rem;
        line-height: 1.5;
    }
    
    .formatted-summary p {
        margin-bottom: 0.75rem;
    }
    
    .formatted-summary h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: var(--text-1, #111827);
    }
    
    .formatted-summary h4 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
        color: var(--text-1, #111827);
    }
    
    .formatted-summary .list-item {
        margin-left: 1.5rem;
        margin-bottom: 0.5rem;
        position: relative;
    }
    
    .formatted-summary .list-item::before {
        content: '';
        position: absolute;
        left: -1rem;
        top: 0.5rem;
        width: 0.375rem;
        height: 0.375rem;
        background-color: var(--text-2, #6b7280);
        border-radius: 50%;
    }
    
    .summary-content {
        line-height: 1.6;
        color: var(--text-1, #111827);
    }
    
    .empty-content {
        color: var(--text-2, #6b7280);
        font-style: italic;
    }
    
    .participants-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .participant-card,
    .participant-edit-card {
        background: var(--surface-1, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .participant-header {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: var(--surface-2, #f3f4f6);
    }
    
    .participant-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 9999px;
        background: var(--surface-3, #3b82f6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        margin-right: 0.75rem;
    }
    
    .participant-info {
        flex: 1;
    }
    
    .participant-name {
        font-weight: 500;
        color: var(--text-1, #111827);
    }
    
    .participant-title {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
    }
    
    .edit-button {
        background: none;
        border: none;
        color: var(--text-2, #6b7280);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 9999px;
        transition: background-color 0.2s;
    }
    
    .edit-button:hover {
        background: var(--surface-3, #3b82f6);
        color: white;
    }
    
    .participant-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .content-section h4 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: var(--text-2, #6b7280);
    }
    
    .content-section p {
        margin: 0;
        line-height: 1.5;
        color: var(--text-1, #111827);
    }
    
    .form-group {
        margin-bottom: 1rem;
        padding: 0 1rem;
    }
    
    .form-group:first-of-type {
        padding-top: 1rem;
    }
    
    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--text-1, #111827);
    }
    
    .form-group textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.375rem;
        background: var(--surface-1, #ffffff);
        color: var(--text-1, #111827);
    }
    
    .form-group textarea:focus {
        outline: none;
        border-color: var(--surface-3, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
    }
    
    .edit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--surface-2, #f3f4f6);
    }
    
    .cancel-button {
        padding: 0.5rem 1rem;
        background: var(--surface-1, #ffffff);
        color: var(--text-2, #6b7280);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
    }
    
    .save-button {
        padding: 0.5rem 1rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
    }
    
    .empty-state {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
        color: var(--text-2, #6b7280);
        text-align: center;
    }
    
    .meeting-room-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--surface-1, #ffffff);
        z-index: 1000;
        padding: 1rem;
        overflow: auto;
    }

    .start-meeting-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        margin-right: 1rem;
    }

    .meeting-actions {
        display: flex;
        align-items: center;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .back-button:hover {
            color: var(--text-1, #f9fafb);
        }
        
        .status-button {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
        }
        
        .error {
            background: #7f1d1d;
            border-color: #b91c1c;
            color: #fee2e2;
        }
        
        .close-error {
            color: #fee2e2;
        }
        
        .meeting-section,
        .participant-card,
        .participant-edit-card {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
        }
        
        .participant-header {
            background: var(--surface-2, #374151);
        }
        
        .form-group textarea {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
            color: var(--text-1, #f9fafb);
        }
        
        .edit-actions {
            background: var(--surface-2, #374151);
        }
        
        .cancel-button {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
        }
        
        .ai-button {
            background: var(--surface-2, #374151);
        }
    }
</style>
