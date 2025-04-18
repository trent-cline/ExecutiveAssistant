import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';

// We'll use any type to avoid TypeScript errors with the OpenAI API
// This is a temporary solution until we can properly type the API

// Get API key from environment variable
// You'll need to set OPENAI_API_KEY in your .env file and ensure it's loaded in your vite.config.js
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

const openai = new OpenAI({
    apiKey: apiKey
});

// Log API key status for debugging (don't log the actual key)
console.log(`OpenAI API key status: ${apiKey ? 'Provided' : 'Missing'}`);

// Store API call logs in memory (will be lost on server restart)
let apiCallLogs: Array<{
    timestamp: string;
    endpoint: string;
    request: any;
    response: any;
    duration: number;
}> = [];

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
        apiCallLogs.unshift({
            timestamp,
            endpoint,
            request: requestData,
            response,
            duration
        });
        
        // Keep only the last 100 logs
        if (apiCallLogs.length > 100) {
            apiCallLogs = apiCallLogs.slice(0, 100);
        }
        
        return response;
    } catch (error: any) {
        // Log the failed call
        const duration = Date.now() - startTime;
        apiCallLogs.unshift({
            timestamp,
            endpoint,
            request: requestData,
            response: { error: error.message || 'Unknown error' },
            duration
        });
        
        // Keep only the last 100 logs
        if (apiCallLogs.length > 100) {
            apiCallLogs = apiCallLogs.slice(0, 100);
        }
        
        throw error;
    }
}

export const GET: RequestHandler = async ({ url }) => {
    const action = url.searchParams.get('action');
    
    if (action === 'getLogs') {
        return json(apiCallLogs);
    }
    
    if (action === 'clearLogs') {
        apiCallLogs = [];
        return json({ success: true, message: 'Logs cleared successfully' });
    }
    
    return json({ error: 'Invalid action' }, { status: 400 });
};

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
    try {
        const { action, data } = await request.json();
        
        switch (action) {
            case 'generateSummary': {
                const { transcript, title, description } = data;
                
                const messages: any[] = [
                    {
                        role: "system",
                        content: `You are an expert business analyst specializing in meeting analysis for high-growth startups. Your task is to create insightful, nuanced summaries that capture not just what was said, but the underlying dynamics, tensions, and opportunities discussed.

                        When analyzing the meeting transcript:
                        1. Identify both explicit decisions and implicit directions the team is leaning toward
                        2. Distinguish between aspirational statements and concrete commitments
                        3. Note areas of alignment and potential conflict between participants
                        4. Recognize unstated assumptions that may impact execution
                        5. Connect discussion points to broader company strategy and market conditions
                        
                        Your summary should be professional but conversational, with specific data points and examples that demonstrate deep understanding of the business context. Avoid generic corporate language in favor of precise, actionable insights.`
                    },
                    {
                        role: "user",
                        content: `Please analyze this meeting transcript and provide:
                        1. A comprehensive summary (3-5 paragraphs)
                        2. 3-5 key points discussed
                        3. Major decisions made
                        4. Specific action items assigned to participants
                        5. How the discussion relates to company objectives
                        
                        Meeting Title: ${title}
                        Meeting Description: ${description}
                        
                        Transcript:
                        ${transcript}`
                    }
                ];
                
                const requestData = {
                    model: "gpt-4o",
                    messages,
                    temperature: 0.7,
                    max_tokens: 1500
                };
                
                const response = await loggedOpenAICall('generateSummary', requestData, () => 
                    openai.chat.completions.create(requestData)
                );

                const content = response.choices[0].message.content || '';
                
                // Parse the response
                const sections = content.split(/\n\s*\n/);
                let summary = '';
                let keyPoints: string[] = [];
                let decisions: string[] = [];
                let actionItems: string[] = [];
                let companyObjectives: string[] = [];
                
                for (const section of sections) {
                    if (section.toLowerCase().includes('key point') || section.toLowerCase().includes('key points')) {
                        const points = section.split(/\n/).filter((line: string) => 
                            line.trim() && 
                            !line.toLowerCase().includes('key point')
                        );
                        keyPoints = points.map((point: string) => {
                            // Remove leading numbers, bullets, etc.
                            return point.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
                        });
                    } else if (section.toLowerCase().includes('decision') || section.toLowerCase().includes('decisions')) {
                        const decisionItems = section.split(/\n/).filter((line: string) => 
                            line.trim() && 
                            !line.toLowerCase().includes('decision')
                        );
                        decisions = decisionItems.map((item: string) => {
                            return item.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
                        });
                    } else if (section.toLowerCase().includes('action item') || section.toLowerCase().includes('action items')) {
                        const items = section.split(/\n/).filter((line: string) => 
                            line.trim() && 
                            !line.toLowerCase().includes('action item')
                        );
                        actionItems = items.map((item: string) => {
                            return item.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
                        });
                    } else if (section.toLowerCase().includes('company objective') || section.toLowerCase().includes('company objectives')) {
                        const objectives = section.split(/\n/).filter((line: string) => 
                            line.trim() && 
                            !line.toLowerCase().includes('company objective')
                        );
                        companyObjectives = objectives.map((objective: string) => {
                            return objective.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
                        });
                    } else if (!section.toLowerCase().includes('summary') || section.split(/\n/).length > 1) {
                        // This is likely the summary section or part of it
                        summary += section + '\n\n';
                    }
                }
                
                return json({
                    summary: summary.trim(),
                    keyPoints: keyPoints.length > 0 ? keyPoints : ['No key points identified'],
                    decisions: decisions.length > 0 ? decisions : ['No decisions identified'],
                    actionItems: actionItems.length > 0 ? actionItems : ['No specific action items identified'],
                    companyObjectives: companyObjectives.length > 0 ? companyObjectives : ['No specific company objectives discussed']
                });
            }
            
            case 'generateActionItems': {
                const { transcript, participants } = data;
                
                // Prepare participant information for the prompt
                const participantInfo = participants.map((p: any) => 
                    `${p.employee.name} (${p.employee.title}): ${p.objectives || 'No specific objectives'}`
                ).join('\n');
                
                const messages: any[] = [
                    {
                        role: "system",
                        content: `You are an executive-level meeting facilitator who specializes in driving accountability and execution in high-growth startups. Your expertise is identifying clear, specific action items that move projects forward and assigning them to the right people based on their roles, expertise, and capacity.

                        When analyzing the meeting transcript to extract action items:
                        1. Distinguish between explicit commitments ("I will do X by Y") and implicit responsibilities based on role and context
                        2. Prioritize items that unblock others or have the highest business impact
                        3. Include specific, measurable deliverables with clear success criteria when possible
                        4. Note dependencies between action items across team members
                        5. Identify follow-up discussions or decisions needed that weren't resolved in the meeting

                        For each action item, include a brief rationale that ties it to business objectives or strategic priorities when relevant. Your goal is to ensure everyone leaves with clarity on exactly what they need to do next.`
                    },
                    {
                        role: "user",
                        content: `Based on this meeting transcript, please identify specific action items for each participant. For each person, provide:
                        1. 2-4 specific action items they committed to or were assigned
                        2. A brief conclusion of their participation and next steps
                        
                        Format the response as JSON with the participant ID as the key, and objects containing actionItems (array) and conclusions (string).
                        
                        Meeting Participants:
                        ${participantInfo}
                        
                        Transcript:
                        ${transcript}`
                    }
                ];
                
                const requestData = {
                    model: "gpt-4o",
                    messages,
                    temperature: 0.7,
                    max_tokens: 1500,
                    response_format: { type: "json_object" as const }
                };
                
                const response = await loggedOpenAICall('generateActionItems', requestData, () => 
                    openai.chat.completions.create(requestData)
                );

                const content = response.choices[0].message.content || '{}';
                const parsedContent = JSON.parse(content);
                
                // Transform the response into our expected format
                const actionItems = [];
                
                for (const participant of participants) {
                    const participantId = participant.id;
                    const participantData = parsedContent[participantId] || parsedContent[participant.employee.name];
                    
                    if (participantData) {
                        actionItems.push({
                            participantId,
                            participantName: participant.employee.name,
                            actionItems: Array.isArray(participantData.actionItems) ? participantData.actionItems : [],
                            conclusions: participantData.conclusions || 'No specific conclusions'
                        });
                    } else {
                        // Default if participant not found in AI response
                        actionItems.push({
                            participantId,
                            participantName: participant.employee.name,
                            actionItems: [],
                            conclusions: 'No specific conclusions or action items identified'
                        });
                    }
                }
                
                return json(actionItems);
            }
            
            case 'generateBackgroundInfo': {
                const { title, description, keyTopics } = data;
                
                // Combine topics into a search query
                const searchQuery = [...keyTopics, title].join(' ');
                
                const messages: any[] = [
                    {
                        role: "system",
                        content: `You are a strategic business intelligence specialist who prepares executive briefings for high-stakes meetings. Your expertise is synthesizing complex industry information into actionable insights that provide crucial context for productive discussions.

                        When preparing background information for a meeting:
                        1. Identify the most relevant business and technical concepts that participants need to understand
                        2. Highlight current market dynamics and competitive landscape shifts that impact decision-making
                        3. Connect industry trends to specific business opportunities or threats for the company
                        4. Provide data points and concrete examples that ground abstract concepts in reality
                        5. Curate high-value resources that offer deeper insights on key topics

                        Your background information should be strategically focused on enabling better decision-making, not just providing general information. Frame everything in terms of business impact and competitive advantage. Use precise, industry-specific terminology that demonstrates deep domain expertise.`
                    },
                    {
                        role: "user",
                        content: `Please provide background information for a meeting with the following details:
                        
                        Meeting Title: ${title}
                        Meeting Description: ${description || 'No description provided'}
                        Key Topics: ${keyTopics.join(', ')}
                        
                        Please structure your response as JSON with the following sections:
                        1. content: A 2-3 paragraph overview of the main topics
                        2. keyConcepts: An array of objects with 'name' and 'description' for 3-5 key concepts relevant to the meeting
                        3. trends: An array of 4-6 current industry trends related to the topics
                        4. resources: An array of objects with 'title' and 'url' for 3-5 relevant resources (articles, tools, etc.)
                        
                        Make sure all information is factual, up-to-date, and directly relevant to the meeting context.`
                    }
                ];
                
                const requestData = {
                    model: "gpt-4-turbo",
                    messages,
                    temperature: 0.7,
                    max_tokens: 1500,
                    response_format: { type: "json_object" as const }
                };
                
                const response = await loggedOpenAICall('generateBackgroundInfo', requestData, () => 
                    openai.chat.completions.create(requestData)
                );

                const content = response.choices[0].message.content || '{}';
                let backgroundInfo;
                
                try {
                    backgroundInfo = JSON.parse(content);
                    
                    // Ensure all expected properties exist
                    backgroundInfo.content = backgroundInfo.content || 'No background information available.';
                    backgroundInfo.keyConcepts = Array.isArray(backgroundInfo.keyConcepts) ? backgroundInfo.keyConcepts : [];
                    backgroundInfo.trends = Array.isArray(backgroundInfo.trends) ? backgroundInfo.trends : [];
                    backgroundInfo.resources = Array.isArray(backgroundInfo.resources) ? backgroundInfo.resources : [];
                    
                    // Validate the structure of keyConcepts and resources
                    backgroundInfo.keyConcepts = backgroundInfo.keyConcepts.map((concept: any) => ({
                        name: concept.name || 'Unnamed Concept',
                        description: concept.description || 'No description available'
                    }));
                    
                    backgroundInfo.resources = backgroundInfo.resources.map((resource: any) => ({
                        title: resource.title || 'Unnamed Resource',
                        url: resource.url || '#'
                    }));
                    
                } catch (parseError) {
                    console.error('Error parsing background info:', parseError);
                    backgroundInfo = {
                        content: 'Error generating background information.',
                        keyConcepts: [],
                        trends: [],
                        resources: []
                    };
                }
                
                return json(backgroundInfo);
            }
            
            case 'generateBackgroundInfo': {
                const { title, description, keyTopics } = data;
                
                // Combine topics into a search query
                const searchQuery = [...keyTopics, title].join(' ');

                const messages: any[] = [
                    {
                        role: "system",
                        content: `You are a strategic business intelligence specialist who prepares executive briefings for high-stakes meetings. Your expertise is synthesizing complex industry information into actionable insights that provide crucial context for productive discussions.

                        When preparing background information for a meeting:
                        1. Identify the most relevant business and technical concepts that participants need to understand
                        2. Highlight current market dynamics and competitive landscape shifts that impact decision-making
                        3. Connect industry trends to specific business opportunities or threats for the company
                        4. Provide data points and concrete examples that ground abstract concepts in reality
                        5. Curate high-value resources that offer deeper insights on key topics

                        Your background information should be strategically focused on enabling better decision-making, not just providing general information. Frame everything in terms of business impact and competitive advantage. Use precise, industry-specific terminology that demonstrates deep domain expertise.
                        
                        For each key concept, include:
                        - A clear, concise definition
                        - Why it matters in the current business context
                        - How it relates to potential decisions the team might make
                        
                        For industry trends, focus on:
                        - Quantifiable shifts in the market (with specific metrics when possible)
                        - Competitor movements and strategic repositioning
                        - Emerging technologies or methodologies that could disrupt the status quo
                        - Regulatory or economic factors that might impact the business
                        
                        Make your content immediately useful by connecting it to practical business outcomes.`
                    },
                    {
                        role: "user",
                        content: `Please provide background information for a meeting with the following details:
                        
                        Meeting Title: ${title}
                        Meeting Description: ${description || 'No description provided'}
                        Key Topics: ${keyTopics.join(', ')}
                        
                        Please structure your response as JSON with the following sections:
                        1. content: A 2-3 paragraph overview of the main topics
                        2. keyConcepts: An array of objects with 'name' and 'description' for 3-5 key concepts relevant to the meeting
                        3. trends: An array of 4-6 current industry trends related to the topics
                        4. resources: An array of objects with 'title' and 'url' for 3-5 relevant resources (articles, tools, etc.)
                        
                        Make sure all information is factual, up-to-date, and directly relevant to the meeting context.`
                    }
                ];
                
                const requestData = {
                    model: "gpt-4",
                    messages,
                    temperature: 0.7,
                    max_tokens: 1500,
                    response_format: { type: "json_object" as const }
                };
                
                const response = await loggedOpenAICall('generateBackgroundInfo', requestData, () => 
                    openai.chat.completions.create(requestData)
                );

                const content = response.choices[0].message.content || '{}';
                let backgroundInfo;
                
                try {
                    backgroundInfo = JSON.parse(content);
                    
                    // Ensure all expected properties exist
                    backgroundInfo.content = backgroundInfo.content || 'No background information available.';
                    backgroundInfo.keyConcepts = Array.isArray(backgroundInfo.keyConcepts) ? backgroundInfo.keyConcepts : [];
                    backgroundInfo.trends = Array.isArray(backgroundInfo.trends) ? backgroundInfo.trends : [];
                    backgroundInfo.resources = Array.isArray(backgroundInfo.resources) ? backgroundInfo.resources : [];
                    
                    // Validate the structure of keyConcepts and resources
                    backgroundInfo.keyConcepts = backgroundInfo.keyConcepts.map((concept: any) => ({
                        name: concept.name || 'Unnamed Concept',
                        description: concept.description || 'No description available'
                    }));
                    
                    backgroundInfo.resources = backgroundInfo.resources.map((resource: any) => ({
                        title: resource.title || 'Unnamed Resource',
                        url: resource.url || '#'
                    }));
                    
                } catch (parseError: unknown) {
                    console.error('Error parsing background info:', parseError);
                    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
                    const errorStack = parseError instanceof Error ? parseError.stack : undefined;
                    const errorCause = parseError instanceof Error ? (parseError as any).cause : undefined;
                    
                    backgroundInfo = {
                        content: 'Error generating background information.',
                        keyConcepts: [],
                        trends: [],
                        resources: []
                    };
                }
                
                return json(backgroundInfo);
            }

            default:
                return json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('API error:', error);
        console.error('API error details:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
};
