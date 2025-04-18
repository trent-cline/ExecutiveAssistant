<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let participants: any[] = [];
    export let messages: any[] = [];
    export let activeParticipant: any = null;
    export let meetingStage: string = 'intro';
    export let currentTopic: string = '';
    export let simulatedParticipants: Record<string, boolean> = {};
    
    const dispatch = createEventDispatcher();
    
    // Determine who should speak next based on conversation context
    function determineNextSpeaker() {
        // If no messages yet, the highest-ranking person should start
        if (messages.length === 0) {
            // For the first message, find the highest ranking participant
            return findHighestRankingParticipant();
        }
        
        const lastMessage = messages[messages.length - 1];
        const lastSpeaker = lastMessage.participant;
        const recentContent = lastMessage.content.toLowerCase();
        
        // Get the last 3 messages for better context
        const recentMessages = messages.slice(-3);
        const conversationContext = recentMessages.map(m => m.content).join(' ').toLowerCase();
        
        // Detect if conversation has a clear direction or needs redirection
        const hasQuestion = recentContent.includes('?');
        const hasActionItem = recentContent.includes('should') || recentContent.includes('need to') || recentContent.includes('have to');
        const isDecisionPoint = recentContent.includes('decide') || recentContent.includes('choose') || recentContent.includes('select');
        const needsExpertise = recentContent.includes('technical') || recentContent.includes('data') || recentContent.includes('research');
        
        // Filter to only AI-simulated participants who aren't the last speaker
        const eligibleParticipants = participants.filter(p => 
            simulatedParticipants[p.id] && 
            (!lastSpeaker || p.id !== lastSpeaker.id)
        );
        
        if (eligibleParticipants.length === 0) return null;
        
        // Score each participant based on relevance to the conversation
        const scoredParticipants = eligibleParticipants.map(participant => {
            const role = (participant.employee?.title || '').toLowerCase();
            const expertise = Array.isArray(participant.expertise) 
                ? participant.expertise.join(' ').toLowerCase() 
                : '';
            const participantName = (participant.employee?.name || '').toLowerCase();
            
            let score = 0;
            
            // Score based on meeting stage
            if (meetingStage === 'intro') {
                // In intro, prioritize leadership
                if (role.includes('ceo') || role.includes('chief') || role.includes('founder')) {
                    score += 5;
                }
                if (role.includes('director') || role.includes('head') || role.includes('lead')) {
                    score += 3;
                }
            } else if (meetingStage === 'discussion') {
                // In discussion, prioritize subject matter experts
                if (expertise && recentContent.split(' ').some(word => expertise.includes(word))) {
                    score += 4;
                }
            } else if (meetingStage === 'conclusion') {
                // In conclusion, prioritize leadership and project managers
                if (role.includes('ceo') || role.includes('chief') || role.includes('founder')) {
                    score += 4;
                }
                if (role.includes('project') || role.includes('product') || role.includes('manager')) {
                    score += 3;
                }
            }
            
            // Topic relevance scoring
            if (currentTopic) {
                const topicWords = currentTopic.toLowerCase().split(' ');
                
                // Check if role is relevant to topic
                if (topicWords.some(word => role.includes(word))) {
                    score += 3;
                }
                
                // Check if expertise is relevant to topic
                if (topicWords.some(word => expertise.includes(word))) {
                    score += 4;
                }
            }
            
            // Content relevance scoring
            const roleKeywords = getRoleKeywords(role);
            if (roleKeywords.some(keyword => recentContent.includes(keyword))) {
                score += 3;
            }
            
            // Question response scoring
            if (recentContent.includes('?')) {
                // If a question was asked, find who it might be directed to
                const questionTopics = extractQuestionTopics(recentContent);
                if (questionTopics.some(topic => role.includes(topic) || expertise.includes(topic))) {
                    score += 5;
                }
            }
            
            // Direct address scoring
            const name = (participant.employee?.name || '').toLowerCase();
            if (recentContent.includes(name)) {
                score += 6; // Someone was directly addressed
            }
            
            // Add some randomness to avoid predictable patterns
            score += Math.random() * 2;
            
            return { participant, score };
        });
        
        // Sort by score and return the highest scoring participant
        scoredParticipants.sort((a, b) => b.score - a.score);
        return scoredParticipants.length > 0 ? scoredParticipants[0].participant : null;
    }
    
    function findHighestRankingParticipant() {
        const rankingOrder = [
            'ceo', 'chief', 'founder', 
            'president', 'director', 
            'head', 'lead', 
            'manager', 'senior'
        ];
        
        // Filter to only AI-simulated participants
        const simulatedParticipantsList = participants.filter(p => simulatedParticipants[p.id]);
        if (simulatedParticipantsList.length === 0) return null;
        
        // Score each participant based on their role's rank
        const scoredParticipants = simulatedParticipantsList.map(participant => {
            const role = (participant.employee?.title || '').toLowerCase();
            let score = 0;
            
            // Give score based on ranking order (higher index = lower priority)
            for (let i = 0; i < rankingOrder.length; i++) {
                if (role.includes(rankingOrder[i])) {
                    score += (rankingOrder.length - i);
                    break;
                }
            }
            
            return { participant, score };
        });
        
        // Sort by score and return the highest scoring participant
        scoredParticipants.sort((a, b) => b.score - a.score);
        return scoredParticipants.length > 0 ? scoredParticipants[0].participant : simulatedParticipantsList[0];
    }
    
    function getRoleKeywords(role: string) {
        const roleKeywordMap: Record<string, string[]> = {
            'ceo': ['strategy', 'vision', 'growth', 'company', 'future', 'leadership', 'investors', 'board'],
            'cto': ['technology', 'architecture', 'infrastructure', 'development', 'engineering', 'technical', 'stack'],
            'cfo': ['finance', 'funding', 'budget', 'cost', 'revenue', 'investment', 'runway', 'cash', 'profit'],
            'marketing': ['customers', 'brand', 'acquisition', 'campaign', 'market', 'audience', 'messaging', 'growth'],
            'sales': ['customers', 'revenue', 'pipeline', 'deals', 'leads', 'conversion', 'clients', 'prospects'],
            'product': ['features', 'roadmap', 'user', 'experience', 'design', 'requirements', 'feedback', 'release'],
            'engineer': ['code', 'development', 'technical', 'implementation', 'architecture', 'bugs', 'testing'],
            'design': ['user', 'interface', 'experience', 'wireframes', 'prototype', 'visual', 'usability'],
            'operations': ['process', 'efficiency', 'workflow', 'resources', 'logistics', 'optimization'],
            'hr': ['team', 'hiring', 'culture', 'employees', 'talent', 'recruitment', 'onboarding']
        };
        
        // Find matching keywords for the role
        const keywords: string[] = [];
        Object.entries(roleKeywordMap).forEach(([key, values]) => {
            if (role.includes(key)) {
                keywords.push(...values);
            }
        });
        
        // Add general business keywords
        const generalKeywords = [
            'startup', 'business', 'company', 'team', 'project', 'goals', 'objectives',
            'timeline', 'metrics', 'performance', 'results', 'challenges', 'opportunities'
        ];
        
        return [...new Set([...keywords, ...generalKeywords])];
    }
    
    function extractQuestionTopics(text: string) {
        // Simple extraction of potential topics from questions
        const questionParts = text.split('?');
        if (questionParts.length <= 1) return [];
        
        // Take the part before the question mark
        const questionText = questionParts[questionParts.length - 2];
        
        // Extract potential topics (nouns and key terms)
        const commonTopics = [
            'product', 'market', 'customer', 'user', 'feature', 'design', 'development',
            'timeline', 'budget', 'cost', 'revenue', 'sales', 'marketing', 'technology',
            'team', 'hiring', 'funding', 'investment', 'strategy', 'roadmap', 'plan',
            'launch', 'growth', 'metrics', 'data', 'analysis', 'competition', 'risk'
        ];
        
        return commonTopics.filter(topic => questionText.toLowerCase().includes(topic));
    }
    
    // Suggest the next speaker
    export function suggestNextSpeaker() {
        const nextSpeaker = determineNextSpeaker();
        if (nextSpeaker) {
            dispatch('suggest', { participant: nextSpeaker });
        }
        return nextSpeaker;
    }
    
    // Determine if the conversation has stalled and needs prompting
    export function checkConversationFlow() {
        if (messages.length === 0) return false;
        
        const lastMessage = messages[messages.length - 1];
        const lastMessageTime = new Date(lastMessage.timestamp).getTime();
        const currentTime = new Date().getTime();
        
        // Get conversation context from recent messages
        const recentMessages = messages.slice(-5);
        const conversationContext = recentMessages.map(m => m.content).join(' ').toLowerCase();
        
        // Detect conversation state
        const hasOpenQuestion = lastMessage.content.includes('?');
        const hasActionPrompt = lastMessage.content.includes('should') || lastMessage.content.includes('need to');
        const isDecisionPoint = conversationContext.includes('decide') || conversationContext.includes('choose');
        const needsExpertise = conversationContext.includes('technical') || conversationContext.includes('data');
        
        // Determine stall threshold based on conversation state
        // Questions and decision points need quicker responses
        let stallThreshold = 5000; // default 5 seconds
        if (hasOpenQuestion) stallThreshold = 3000; // 3 seconds for questions
        if (isDecisionPoint) stallThreshold = 4000; // 4 seconds for decisions
        
        // If enough time has passed since the last message and no active participant
        const conversationStalled = !activeParticipant && (currentTime - lastMessageTime > stallThreshold);
        
        if (conversationStalled) {
            // Find the most appropriate person to continue the conversation based on context
            const continuationSpeaker = determineNextSpeaker();
            if (continuationSpeaker) {
                // Extract more specific topic information for better continuity
                const detectedTopic = currentTopic || extractTopicFromMessages(messages.slice(-3));
                
                // Determine if we need to redirect the conversation
                const conversationNeeded = {
                    needsDecision: isDecisionPoint && !hasActionPrompt,
                    needsExpertise: needsExpertise,
                    hasOpenQuestion: hasOpenQuestion,
                    meetingStage: meetingStage
                };
                
                dispatch('prompt-continuation', { 
                    participant: continuationSpeaker,
                    lastSpeaker: lastMessage.participant,
                    topic: detectedTopic,
                    conversationNeeded: conversationNeeded
                });
                return true;
            }
        }
        
        return false;
    }
    
    // Extract a topic from recent messages
    function extractTopicFromMessages(recentMessages: any[]) {
        if (recentMessages.length === 0) return '';
        
        const combinedContent = recentMessages.map(m => m.content).join(' ').toLowerCase();
        
        // List of important business topics
        const potentialTopics = [
            'funding', 'product', 'revenue', 'customers', 'growth', 'marketing',
            'sales', 'development', 'engineering', 'design', 'hiring', 'team',
            'competition', 'strategy', 'roadmap', 'metrics', 'investors', 'runway'
        ];
        
        // Find topics mentioned in the conversation
        const mentionedTopics = potentialTopics.filter(topic => combinedContent.includes(topic));
        
        return mentionedTopics.length > 0 ? mentionedTopics[0] : 'the current discussion';
    }
</script>
