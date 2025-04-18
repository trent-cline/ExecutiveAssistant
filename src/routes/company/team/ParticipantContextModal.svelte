<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    
    export let participant: any;
    export let meeting: any;
    export let show = false;
    export let simulatedParticipants: Record<string, boolean> = {};
    
    function closeModal() {
        show = false;
    }
    
    // Extract participant context information
    $: name = participant?.employee?.name || 'Team Member';
    $: role = participant?.employee?.title || 'Employee';
    $: objectives = participant?.objectives || 'No specific objectives defined';
    $: expertise = participant?.expertise || [];
    $: preMeetingSummary = meeting?.pre_meeting_summary || '';
    $: department = participant?.employee?.department || 'Unknown department';
    $: isAI = participant?.id && participant?.id in simulatedParticipants ? simulatedParticipants[participant.id] : false;
    
    // Format expertise as a readable string
    $: formattedExpertise = Array.isArray(expertise) && expertise.length > 0 
        ? expertise.join(', ') 
        : 'No specific expertise defined';
    
    // Handle keyboard events
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

{#if show && participant}
<div 
    class="modal-backdrop" 
    on:click|self={closeModal}
    on:keydown={handleKeydown}
    role="presentation"
    transition:fade={{ duration: 200 }}
>
    <div 
        class="modal-content" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="context-modal-title"
        transition:fly={{ y: 20, duration: 300 }}
    >
        <div class="modal-header">
            <h2 id="context-modal-title">
                {name}'s Context Information
                {#if isAI}
                    <span class="ai-badge">AI Simulated</span>
                {/if}
            </h2>
            <button class="close-button" on:click={closeModal} aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="modal-body">
            <div class="context-section">
                <h3>Basic Information</h3>
                <div class="context-item">
                    <div class="label">Name:</div>
                    <div class="value">{name}</div>
                </div>
                <div class="context-item">
                    <div class="label">Role:</div>
                    <div class="value">{role}</div>
                </div>
                <div class="context-item">
                    <div class="label">Department:</div>
                    <div class="value">{department}</div>
                </div>
            </div>
            
            <div class="context-section">
                <h3>Meeting Context</h3>
                <div class="context-item">
                    <div class="label">Objectives:</div>
                    <div class="value">{objectives}</div>
                </div>
                <div class="context-item">
                    <div class="label">Expertise:</div>
                    <div class="value">{formattedExpertise}</div>
                </div>
            </div>
            
            <div class="context-section">
                <h3>AI Response Generation Factors</h3>
                <p class="info-text">
                    When simulating this participant, the AI considers these factors to generate contextually 
                    appropriate responses:
                </p>
                <ul class="factors-list">
                    <li>Role-specific knowledge and terminology</li>
                    <li>Department perspective and priorities</li>
                    <li>Meeting objectives and agenda</li>
                    <li>Recent conversation context and topics</li>
                    <li>Relationship to other participants</li>
                    <li>Current meeting stage (intro, discussion, conclusion)</li>
                </ul>
            </div>
            
            {#if preMeetingSummary}
            <div class="context-section">
                <h3>Pre-Meeting Summary</h3>
                <div class="pre-meeting-content">
                    {preMeetingSummary}
                </div>
            </div>
            {/if}
            
            <div class="context-section">
                <h3>Response Templates</h3>
                <p class="info-text">
                    The AI uses role-appropriate response templates like these:
                </p>
                <div class="response-examples">
                    {#if role.toLowerCase().includes('ceo') || role.toLowerCase().includes('chief')}
                        <div class="example">
                            "As {role}, I believe we should focus on strategic growth while maintaining our core values..."
                        </div>
                        <div class="example">
                            "From an executive perspective, we need to consider both short-term results and long-term sustainability..."
                        </div>
                    {:else if role.toLowerCase().includes('tech') || role.toLowerCase().includes('engineer') || role.toLowerCase().includes('developer')}
                        <div class="example">
                            "From a technical standpoint, we should consider the architecture implications before proceeding..."
                        </div>
                        <div class="example">
                            "I've been looking into solutions for this. We could leverage our existing systems with some modifications..."
                        </div>
                    {:else if role.toLowerCase().includes('market') || role.toLowerCase().includes('sales')}
                        <div class="example">
                            "Our customer research indicates that users are looking for more intuitive interfaces..."
                        </div>
                        <div class="example">
                            "From a marketing perspective, we should emphasize our unique value proposition in these materials..."
                        </div>
                    {:else if role.toLowerCase().includes('finance') || role.toLowerCase().includes('account')}
                        <div class="example">
                            "Looking at the financial implications, we need to consider the ROI of this initiative..."
                        </div>
                        <div class="example">
                            "Based on our current budget constraints, I recommend we prioritize these investments..."
                        </div>
                    {:else}
                        <div class="example">
                            "I think we should consider multiple perspectives before making a decision..."
                        </div>
                        <div class="example">
                            "Based on my experience, we might want to approach this problem differently..."
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .ai-badge {
        font-size: 0.75rem;
        font-weight: 500;
        padding: 2px 8px;
        background: #3b82f6;
        color: white;
        border-radius: 4px;
    }
    
    .close-button {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-button:hover {
        color: #111827;
    }
    
    .modal-body {
        padding: 24px;
    }
    
    .context-section {
        margin-bottom: 24px;
    }
    
    .context-section h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: #111827;
    }
    
    .context-item {
        display: flex;
        margin-bottom: 8px;
    }
    
    .label {
        font-weight: 500;
        width: 120px;
        flex-shrink: 0;
        color: #4b5563;
    }
    
    .value {
        flex: 1;
        color: #111827;
    }
    
    .info-text {
        margin: 0 0 12px 0;
        color: #4b5563;
        font-size: 0.875rem;
    }
    
    .factors-list {
        margin: 0;
        padding-left: 24px;
    }
    
    .factors-list li {
        margin-bottom: 4px;
        color: #111827;
    }
    
    .pre-meeting-content {
        background-color: #f9fafb;
        padding: 12px;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
        font-size: 0.875rem;
        color: #111827;
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
    }
    
    .response-examples {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .example {
        background-color: #f3f4f6;
        padding: 12px;
        border-radius: 4px;
        border-left: 3px solid #3b82f6;
        font-size: 0.875rem;
        color: #111827;
        font-style: italic;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .modal-content {
            background-color: #1f2937;
        }
        
        .modal-header {
            border-bottom-color: #374151;
        }
        
        .modal-header h2 {
            color: #f9fafb;
        }
        
        .close-button {
            color: #9ca3af;
        }
        
        .close-button:hover {
            color: #f9fafb;
        }
        
        .context-section h3 {
            color: #f9fafb;
        }
        
        .label {
            color: #9ca3af;
        }
        
        .value {
            color: #f9fafb;
        }
        
        .info-text {
            color: #9ca3af;
        }
        
        .factors-list li {
            color: #f9fafb;
        }
        
        .pre-meeting-content {
            background-color: #111827;
            border-color: #374151;
            color: #f9fafb;
        }
        
        .example {
            background-color: #111827;
            color: #f9fafb;
        }
    }
</style>
