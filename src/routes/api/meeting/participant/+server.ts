import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';

// Get API key from environment variable
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

const openai = new OpenAI({
    apiKey: apiKey
});

// Helper function to log API calls
async function loggedOpenAICall(endpoint: string, requestData: any, apiCall: () => Promise<any>) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
        // Execute the API call
        const response = await apiCall();
        
        // Calculate duration
        const duration = Date.now() - startTime;
        
        // Log the successful call
        console.log(`API call to ${endpoint} completed in ${duration}ms`);
        
        return response;
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
    try {
        const { participant, triggerMessage, messageHistory, meetingStage, meetingContext } = await request.json();
        
        // Prepare the conversation history for the prompt
        const conversationContext = messageHistory.map((m: any) => 
            `${m.participant.employee?.name} (${m.participant.employee?.title}): ${m.content}`
        ).join('\n');
        
        // Extract key information about the participant
        const name = participant.employee?.name || 'Team Member';
        const role = participant.employee?.title || 'Employee';
        const expertise = Array.isArray(participant.expertise) ? participant.expertise.join(', ') : '';
        const objectives = participant.objectives || '';
        
        // Extract information about the trigger message
        const triggerContent = triggerMessage.content;
        const speakerName = triggerMessage.participant.employee?.name || 'Someone';
        const speakerRole = triggerMessage.participant.employee?.title || 'Team Member';
        
        // Create a system prompt that guides the AI to generate a realistic response
        const messages: any[] = [
            {
                role: "system",
                content: `You are ${name}, the ${role} at a Series A startup called Pillar that builds an AI-powered productivity platform. You are participating in a team meeting and need to respond to what was just said in a realistic, professional manner.

                Your expertise areas: ${expertise || role}
                Your objectives for this meeting: ${objectives || 'Contribute valuable insights based on your role'}
                Current meeting stage: ${meetingStage} (intro, discussion, or conclusion)
                
                When responding:
                1. Stay in character as ${name} with the role of ${role}
                2. Be specific and data-driven when possible
                3. Reference your expertise and company context
                4. Address the previous speaker's points directly
                5. Keep your response concise (2-4 sentences) and focused
                
                Your response should sound like a real person in a business meeting, not generic or overly formal. Use industry-specific terminology relevant to your role.`
            },
            {
                role: "user",
                content: `Here is the recent conversation in the meeting:

${conversationContext}

${speakerName} (${speakerRole}) just said: "${triggerContent}"

How would you (${name}, ${role}) respond to this in a natural, contextually appropriate way?`
            }
        ];
        
        const requestData = {
            model: "gpt-4o",
            messages,
            temperature: 0.7,
            max_tokens: 200
        };
        
        const response = await loggedOpenAICall('generateParticipantResponse', requestData, () => 
            openai.chat.completions.create(requestData)
        );

        const content = response.choices[0].message.content || 'I need more information before I can respond to that.';
        
        return json({ response: content });
    } catch (error: any) {
        console.error(`Error in participant response API:`, error);
        return json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
    }
};
