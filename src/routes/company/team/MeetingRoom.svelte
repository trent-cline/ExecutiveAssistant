<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { supabase } from '$lib/supabase';
    import ParticipantContextModal from './ParticipantContextModal.svelte';
    import MeetingCoordinator from './MeetingCoordinator.svelte';
    
    export let meeting: any;
    export let participants: any[] = [];
    
    const dispatch = createEventDispatcher();
    
    let isRecording = false;
    let transcript = '';
    let messages: any[] = [];
    let newMessage = '';
    let activeParticipant: any = null;
    let meetingStage = 'intro'; // intro, discussion, conclusion
    let error: string | null = null;
    let timer: any = null;
    let elapsedTime = 0;
    let simulatedParticipants: Record<string, boolean> = {};
    let isGeneratingResponse = false;
    let currentTopic = '';
    let showPreMeetingSummary = false;
    let showContextModal = false;
    let selectedContextParticipant: any = null;
    let meetingCoordinator: any;
    let autoSuggestSpeakers = true;
    let autoContinueConversation = true; // New flag to enable auto-continuation
    let conversationCheckInterval: any = null;
    
    // Initialize simulated participants
    $: if (participants.length > 0 && Object.keys(simulatedParticipants).length === 0) {
        participants.forEach(p => {
            simulatedParticipants[p.id] = false;
        });
    }
    
    onMount(() => {
        // Start the meeting timer
        startTimer();
        
        // Initialize resizable transcript panel
        initResizablePanel();
        
        // Set up conversation flow monitoring
        if (autoContinueConversation) {
            conversationCheckInterval = setInterval(() => {
                if (meetingCoordinator && !isGeneratingResponse) {
                    meetingCoordinator.checkConversationFlow();
                }
            }, 5000); // Check every 5 seconds
        }
        
        return () => {
            if (timer) clearInterval(timer);
            if (conversationCheckInterval) clearInterval(conversationCheckInterval);
        };
    });
    
    function initResizablePanel() {
        const resizeHandle = document.getElementById('transcript-resize-handle');
        const transcriptPanel = document.querySelector('.transcript-panel') as HTMLElement;
        
        if (!resizeHandle || !transcriptPanel) return;
        
        let isResizing = false;
        let initialX = 0;
        let initialWidth = 0;
        
        const handleResize = (e: MouseEvent) => {
            isResizing = true;
            initialX = e.clientX;
            initialWidth = transcriptPanel.offsetWidth;

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const delta = e.clientX - initialX;
            const newWidth = initialWidth + delta;
            
            // Set min and max width constraints
            if (newWidth > 200 && newWidth < window.innerWidth - 400) {
                transcriptPanel.style.width = `${newWidth}px`;
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
        
        // Add event listener to the resize handle
        resizeHandle.addEventListener('mousedown', handleResize);
    }
    
    function startTimer() {
        timer = setInterval(() => {
            elapsedTime += 1;
            
            // Auto-progress meeting stages based on time
            if (elapsedTime === 300 && meetingStage === 'intro') { // 5 minutes
                meetingStage = 'discussion';
            } else if (elapsedTime === 1500 && meetingStage === 'discussion') { // 25 minutes
                meetingStage = 'conclusion';
            }
        }, 1000);
    }
    
    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function selectParticipant(participant: any) {
        activeParticipant = participant;
    }
    
    function showParticipantContext(participant: any) {
        selectedContextParticipant = participant;
        showContextModal = true;
    }
    
    function addMessage() {
        if (!newMessage.trim() || !activeParticipant) return;
        
        const message = {
            id: Date.now().toString(),
            participant: activeParticipant,
            content: newMessage,
            timestamp: new Date().toISOString()
        };
        
        messages = [...messages, message];
        transcript += `${activeParticipant.employee?.name}: ${newMessage}\n`;
        newMessage = '';
        activeParticipant = null; // Clear active participant to allow for next speaker selection
        
        // Generate AI responses for simulated participants
        generateAIResponses(message);
        
        // After a short delay, suggest the next speaker if auto-suggest is enabled
        if (autoSuggestSpeakers && meetingCoordinator) {
            setTimeout(() => {
                if (!activeParticipant) {
                    meetingCoordinator.suggestNextSpeaker();
                }
            }, 1000);
        }
    }
    
    async function generateAIResponses(triggerMessage: any) {
        if (isGeneratingResponse) return;
        
        // Find participants with simulation enabled
        const simulatedIds = Object.entries(simulatedParticipants)
            .filter(([_, enabled]) => enabled)
            .map(([id, _]) => id);
            
        if (simulatedIds.length === 0) return;
        
        isGeneratingResponse = true;
        
        try {
            // For each simulated participant, generate a response
            for (const participantId of simulatedIds) {
                const participant = participants.find(p => p.id === participantId);
                if (!participant || participant.id === triggerMessage.participant.id) continue;
                
                // Short delay to make responses feel natural
                await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
                
                try {
                    // Use the API to generate a more realistic response
                    const apiResponse = await fetch('/api/meeting/participant', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            participant,
                            triggerMessage,
                            messageHistory: messages.slice(-5), // Send the last 5 messages for context
                            meetingStage,
                            meetingContext: meeting
                        })
                    });
                    
                    if (!apiResponse.ok) {
                        throw new Error('Failed to generate AI response');
                    }
                    
                    const data = await apiResponse.json();
                    const response = data.response;
                    
                    const responseMessage = {
                        id: Date.now().toString(),
                        participant: participant,
                        content: response,
                        timestamp: new Date().toISOString(),
                        isAI: true
                    };
                    
                    messages = [...messages, responseMessage];
                    transcript += `${participant.employee.name}: ${response}\n`;
                } catch (apiError) {
                    console.error('Error calling participant response API:', apiError);
                    
                    // Fall back to the local response generation if API fails
                    const fallbackResponse = generateContextualResponse(
                        participant, 
                        triggerMessage, 
                        messages, 
                        meetingStage,
                        meeting
                    );
                    
                    const responseMessage = {
                        id: Date.now().toString(),
                        participant: participant,
                        content: fallbackResponse,
                        timestamp: new Date().toISOString(),
                        isAI: true
                    };
                    
                    messages = [...messages, responseMessage];
                    transcript += `${participant.employee.name}: ${fallbackResponse}\n`;
                }
            }
        } catch (err) {
            console.error('Error generating AI responses:', err);
        } finally {
            isGeneratingResponse = false;
        }
    }
    
    function generateContextualResponse(
        participant: any, 
        triggerMessage: any, 
        messageHistory: any[], 
        stage: string,
        meetingContext: any
    ) {
        // Company context - simulate a specific startup with real challenges
        const companyContext = {
            name: 'Pillar',
            stage: 'Series A',
            product: 'AI-powered productivity platform',
            users: 15000,
            monthlyGrowth: 12,
            runway: 14, // months
            competitors: ['Notion AI', 'ClickUp', 'Monday.com', 'Asana'],
            challenges: ['user retention', 'enterprise sales cycle', 'technical scalability', 'hiring senior engineers'],
            strengths: ['innovative AI features', 'strong NPS score', 'low CAC in SMB segment', 'proprietary ML models'],
            recentMilestones: ['crossed $1M ARR', 'launched mobile app', 'secured key enterprise client', 'released API'],
            upcomingGoals: ['double MRR', 'reduce churn by 20%', 'launch enterprise SSO', 'expand sales team'],
            teamSize: 32,
            departments: ['Engineering', 'Product', 'Marketing', 'Sales', 'Customer Success', 'Finance', 'Operations'],
            investors: ['Sequoia', 'Andreessen Horowitz', 'Y Combinator', 'Founders Fund']
        };
        
        // Participant information
        const name = participant.employee?.name || 'Team Member';
        const role = participant.employee?.title || 'Employee';
        const objectives = participant.objectives || '';
        const preMeetingSummary = meetingContext.pre_meeting_summary || '';
        const department = participant.employee?.department || '';
        const expertise = Array.isArray(participant.expertise) ? participant.expertise : [];
        
        // Extract key information from trigger message
        const triggerContent = triggerMessage.content;
        const speakerName = triggerMessage.participant.employee?.name || 'Someone';
        const speakerRole = triggerMessage.participant.employee?.title || 'Team Member';
        const meetingTitle = meetingContext.title || 'Team Meeting';
        
        // Get more context from recent conversation
        const recentMessages = messageHistory.slice(-5);
        const recentContent = recentMessages.map(m => m.content).join(' ');
        const conversationHistory = messageHistory.map(m => `${m.participant.employee?.name}: ${m.content}`).join('\n');
        
        // Detect if a question was asked
        const wasQuestionAsked = triggerContent.includes('?');
        
        // Detect if participant was directly addressed
        const wasAddressed = triggerContent.toLowerCase().includes(name.toLowerCase());
        
        // Detect topic from recent messages
        const topics = detectTopics(recentContent);
        if (topics.length > 0) {
            currentTopic = topics[0];
        }
        
        // Determine conversation tone and formality based on meeting stage and participants
        const isFormal = role.toLowerCase().includes('ceo') || 
                       role.toLowerCase().includes('chief') || 
                       stage === 'intro' || 
                       meetingTitle.toLowerCase().includes('board');
        
        // Generate direct response to the trigger message
        let response = '';
        
        // Add thought process for more realistic responses
        const thoughts = [];
        
        // Consider role perspective and specific company context
        thoughts.push(`As ${role} at ${companyContext.name}, I'm focused on ${getRolePriorities(role)} in our ${companyContext.stage} stage company.`);
        
        // Consider meeting context and current business challenges
        thoughts.push(`This ${meetingTitle} is happening when we're facing challenges with ${companyContext.challenges.join(', ')}.`);
        
        // Consider trigger message in context of business goals
        thoughts.push(`${speakerName}'s point about "${triggerContent}" relates to our goal of ${companyContext.upcomingGoals[Math.floor(Math.random() * companyContext.upcomingGoals.length)]}.`);
        
        // Consider specific metrics and data points relevant to the discussion
        thoughts.push(`I should reference our ${companyContext.users} users, ${companyContext.monthlyGrowth}% monthly growth, and ${companyContext.runway} months of runway in my response.`);
        
        // Consider how to respond with specific, actionable insights
        if (wasQuestionAsked) {
            thoughts.push(`This question requires specific data and a concrete recommendation.`);
        } else if (wasAddressed) {
            thoughts.push(`I need to address ${speakerName}'s point with specific examples from our ${department} team's work.`);
        } else {
            thoughts.push(`I should contribute unique insights from my work on ${expertise.join(', ') || role} that others might not have considered.`);
        }
        
        // If this is the first message in the intro stage, reference the pre-meeting summary
        if (stage === 'intro' && messageHistory.length <= 2 && preMeetingSummary) {
            if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('chief')) {
                return `As ${role}, I'd like to welcome everyone to this meeting on ${meetingContext.title}. According to our pre-meeting summary, we have several key objectives to address today. My specific focus will be on ${objectives || 'providing strategic direction'}. Let's have a productive discussion.`;
            } else if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('director')) {
                return `Thanks for organizing this meeting. I've reviewed the pre-meeting summary and I'm prepared to discuss our ${currentTopic || 'agenda items'}. My team has been working on ${objectives || 'our assigned tasks'} and I'm ready to share our progress.`;
            } else {
                return `Thanks for including me in this meeting. I've reviewed the pre-meeting materials and I'm ready to contribute to our discussion on ${meetingContext.title}. My focus today will be on ${objectives || 'providing input from my area of expertise'}.`;
            }
        }
        
        // Check for specific topics in the trigger message
        if (triggerContent.toLowerCase().includes('money') || 
            triggerContent.toLowerCase().includes('funding') || 
            triggerContent.toLowerCase().includes('budget') || 
            triggerContent.toLowerCase().includes('invest') ||
            triggerContent.toLowerCase().includes('financial')) {
            
            thoughts.push('This discussion is about funding or finances.');
            
            if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('founder')) {
                thoughts.push('As the CEO, I need to balance investor expectations with our strategic vision and provide clear direction on fundraising.');
                
                // Highly specific CEO responses with concrete metrics and strategic vision
                const responses = [
                    `${wasAddressed ? speakerName + ', ' : ''}After my meetings with ${companyContext.investors[0]} and ${companyContext.investors[1]} last week, I've refined our fundraising strategy. With our ${companyContext.users.toLocaleString()} users growing at ${companyContext.monthlyGrowth}% month-over-month and a clear path to $${(companyContext.users * 12 / 1000).toFixed(1)}M ARR, we should target a $7-8M Series A at a $35-40M valuation. Our NPS of 72 and negative churn in the SMB segment puts us in the top quartile of SaaS companies at our stage.`,
                    
                    `To build on ${speakerName}'s point about finances, our current burn rate of $${(companyContext.users * 0.8 / 100).toFixed(0)}K/month gives us exactly ${companyContext.runway} months of runway. I've been talking with ${companyContext.investors[2]} who specifically wants to lead our next round. They're looking for companies with our exact profile - ${companyContext.monthlyGrowth}% MoM growth, strong product-market fit in the productivity space, and a clear path to outcompeting ${companyContext.competitors[0]} and ${companyContext.competitors[1]} in the enterprise segment.`,
                    
                    `I appreciate you bringing up the funding question, ${speakerName}. Our Q1 metrics just came in: CAC is down to $${Math.floor(Math.random() * 100) + 150} while LTV has increased to $${Math.floor(Math.random() * 1000) + 2000}. Our magic number is now ${(Math.random() * 0.5 + 0.7).toFixed(1)}, which puts us in a strong position. I've already had preliminary discussions with ${companyContext.investors[3]} who indicated they'd be interested in leading a $8-10M round if we can demonstrate our ability to solve our ${companyContext.challenges[0]} challenge and accelerate growth in the mid-market segment.`,
                    
                    `Let me share what I'm hearing from the market. ${companyContext.investors[1]} just led a $12M round for ${companyContext.competitors[2]} at a $60M valuation with metrics comparable to ours. Their multiple was 15x ARR, which would put us at a $${(companyContext.users * 12 / 1000 * 15).toFixed(0)}M valuation. However, our proprietary ${companyContext.strengths[3]} and significantly better retention metrics should command a premium. I'm targeting a raise of $8-9M while keeping dilution under 20%.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else if (role.toLowerCase().includes('cto') || role.toLowerCase().includes('tech')) {
                thoughts.push('I need to articulate our technical challenges, architecture decisions, and how funding will address specific scaling bottlenecks.');
                
                // Create a realistic tech stack for an AI productivity platform
                const techStack = {
                    frontend: ['React', 'TypeScript', 'Redux', 'Tailwind CSS'],
                    backend: ['Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Redis'],
                    infrastructure: ['AWS', 'Kubernetes', 'Terraform', 'GitHub Actions'],
                    ai: ['PyTorch', 'Hugging Face Transformers', 'OpenAI API', 'LangChain'],
                    monitoring: ['Datadog', 'Sentry', 'ELK Stack'],
                    challenges: ['model latency', 'data pipeline reliability', 'API rate limits', 'cold start times', 'fine-tuning costs']
                };
                
                const responses = [
                    `From a technical perspective, I've mapped out exactly where we need to invest. Our ${techStack.backend[2]} services are hitting scalability limits at ${companyContext.users.toLocaleString()} users, with p95 latency spiking to 780ms during peak hours. We need to refactor our ${techStack.ai[0]} inference pipeline and implement a proper ${techStack.infrastructure[1]} cluster with autoscaling. I estimate we need 3 senior backend engineers at $${Math.floor(Math.random() * 30) + 170}K each and $${Math.floor(Math.random() * 5) + 15}K monthly in additional ${techStack.infrastructure[0]} costs to handle 10x our current load.`,
                    
                    `${speakerName}, regarding our financial strategy, I need to highlight our technical challenges. We're currently spending $${Math.floor(Math.random() * 20) + 30}K monthly on ${techStack.ai[2]} costs alone, which will scale linearly with user growth. I've been working on our own fine-tuned ${techStack.ai[1]} models that would reduce this by 60-70% and give us a competitive advantage. With funding, I can hire 2 ML engineers and have this deployed within 4 months, saving us approximately $${Math.floor(Math.random() * 100) + 200}K annually at our projected scale.`,
                    
                    `I've been analyzing our architecture in preparation for fundraising. Our microservice approach with ${techStack.infrastructure[1]} gives us significant scaling advantages over ${companyContext.competitors[0]} and ${companyContext.competitors[1]}, who are still using monolithic architectures. However, we're hitting ${techStack.challenges[0]} and ${techStack.challenges[3]} issues that are affecting user experience. With $${Math.floor(Math.random() * 500) + 1000}K in technical investment, we can implement our custom ${techStack.ai[3]} orchestration layer and reduce latency by 65%, which directly impacts our retention metrics.`,
                    
                    `Our technical differentiation is key to our fundraising narrative. While our competitors are using off-the-shelf AI models, we've developed proprietary training techniques that improve accuracy by 23% on domain-specific tasks. This is reflected in our NPS being 15 points higher than ${companyContext.competitors[2]}. To maintain this advantage, we need to invest $${Math.floor(Math.random() * 200) + 300}K in our ML infrastructure and hire a team of 4 specialized engineers. I've drafted a technical roadmap showing how this investment translates to specific product capabilities our competitors can't match.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else if (role.toLowerCase().includes('cfo') || role.toLowerCase().includes('finance')) {
                thoughts.push('I need to provide precise financial analysis with specific SaaS metrics that demonstrate our unit economics and growth trajectory.');
                
                // Create detailed financial metrics for a Series A SaaS startup
                const financialMetrics = {
                    mrr: companyContext.users * 12, // $12 ARPU
                    arr: companyContext.users * 12 * 12, // Annual recurring revenue
                    growthRate: companyContext.monthlyGrowth,
                    burnRate: companyContext.users * 0.8, // $0.80 per user cost
                    runway: companyContext.runway,
                    cac: Math.floor(Math.random() * 50) + 120, // Customer acquisition cost
                    ltv: Math.floor(Math.random() * 800) + 1200, // Lifetime value
                    grossMargin: Math.floor(Math.random() * 10) + 75, // Gross margin percentage
                    netDollarRetention: Math.floor(Math.random() * 20) + 105, // Net dollar retention
                    paybackPeriod: Math.floor(Math.random() * 10) + 8, // CAC payback period in months
                    cashOnHand: (companyContext.users * 0.8) * companyContext.runway, // Current cash
                    revenueMultiple: Math.floor(Math.random() * 5) + 12, // For valuation
                    churnRate: (Math.random() * 1.5 + 1.0).toFixed(1), // Monthly churn percentage
                    expansionRevenue: Math.floor(Math.random() * 15) + 20 // Percentage of revenue from expansion
                };
                
                const responses = [
                    `Let me walk through our financial position with precision. We're currently at $${(financialMetrics.mrr/1000).toFixed(1)}K MRR, growing at ${companyContext.monthlyGrowth}% month-over-month, which translates to $${(financialMetrics.arr/1000000).toFixed(2)}M ARR. Our burn rate is $${(financialMetrics.burnRate/1000).toFixed(0)}K monthly with ${financialMetrics.runway} months of runway remaining. Our Rule of 40 score is ${(companyContext.monthlyGrowth + financialMetrics.grossMargin - 20).toFixed(1)}, which puts us in the top quartile of SaaS companies at our stage. To maintain our current growth trajectory while extending runway to 24 months, we need to raise $${((financialMetrics.burnRate * 24)/1000000).toFixed(1)}M, ideally at a $${(financialMetrics.arr * financialMetrics.revenueMultiple/1000000).toFixed(1)}M post-money valuation based on current SaaS multiples.`,
                    
                    `I've completed our Q1 financial analysis, and our unit economics have improved significantly. CAC is now $${financialMetrics.cac} (down 18% QoQ), with LTV at $${financialMetrics.ltv}, giving us an LTV:CAC ratio of ${(financialMetrics.ltv/financialMetrics.cac).toFixed(1)}x. Our CAC payback period has decreased to ${financialMetrics.paybackPeriod} months, and our net dollar retention is at ${financialMetrics.netDollarRetention}%, indicating strong product-market fit. With gross margins at ${financialMetrics.grossMargin}%, we're outperforming ${companyContext.competitors[1]} and ${companyContext.competitors[2]} in efficiency metrics. These improvements make this an optimal time to raise our Series A.`,
                    
                    `To build on ${speakerName}'s point, I've modeled three fundraising scenarios. At our current $${(financialMetrics.mrr/1000).toFixed(1)}K MRR with ${companyContext.monthlyGrowth}% MoM growth, we're tracking toward $${(financialMetrics.mrr * Math.pow(1 + companyContext.monthlyGrowth/100, 12)/1000).toFixed(0)}K MRR by EOY. Our expansion revenue is now ${financialMetrics.expansionRevenue}% of total revenue, offsetting our ${financialMetrics.churnRate}% monthly churn. This creates a net revenue retention of ${financialMetrics.netDollarRetention}%. If we raise $8M at a $${(financialMetrics.arr * financialMetrics.revenueMultiple/1000000).toFixed(0)}M valuation (${financialMetrics.revenueMultiple}x ARR multiple), we can triple our growth spend while maintaining 24 months of runway, putting us on track for a strong Series B in 18-20 months.`,
                    
                    `I've just finished our investor-ready financial model. Our current cash position is $${(financialMetrics.cashOnHand/1000000).toFixed(1)}M with a monthly burn of $${(financialMetrics.burnRate/1000).toFixed(0)}K. Our magic number is ${((companyContext.users * 0.12) / (financialMetrics.cac * (companyContext.users/10))).toFixed(2)}, indicating efficient growth. The key insight from my analysis is that increasing our sales and marketing spend by 75% would optimize our unit economics, as our CAC in enterprise segments is actually decreasing as we gain brand recognition. With a $7-9M raise, we could accelerate growth to ${companyContext.monthlyGrowth + 5}% MoM while maintaining our current efficiency metrics, putting us in the top decile of SaaS companies at our stage and positioning us for a premium multiple at Series B.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else if (role.toLowerCase().includes('market')) {
                thoughts.push('I need to provide specific marketing metrics, channel performance data, and our growth strategy with concrete examples.');
                
                // Create detailed marketing metrics and channel data
                const marketingMetrics = {
                    channels: [
                        { name: 'Content Marketing', cac: Math.floor(Math.random() * 40) + 80, convRate: (Math.random() * 2 + 1.5).toFixed(1), contribution: Math.floor(Math.random() * 15) + 20 },
                        { name: 'Paid Search', cac: Math.floor(Math.random() * 60) + 140, convRate: (Math.random() * 3 + 3).toFixed(1), contribution: Math.floor(Math.random() * 10) + 15 },
                        { name: 'Social Media', cac: Math.floor(Math.random() * 50) + 100, convRate: (Math.random() * 1 + 1).toFixed(1), contribution: Math.floor(Math.random() * 8) + 12 },
                        { name: 'Partnerships', cac: Math.floor(Math.random() * 30) + 60, convRate: (Math.random() * 4 + 4).toFixed(1), contribution: Math.floor(Math.random() * 12) + 8 },
                        { name: 'SEO', cac: Math.floor(Math.random() * 20) + 40, convRate: (Math.random() * 1 + 0.8).toFixed(1), contribution: Math.floor(Math.random() * 15) + 25 },
                        { name: 'Referrals', cac: Math.floor(Math.random() * 15) + 30, convRate: (Math.random() * 5 + 8).toFixed(1), contribution: Math.floor(Math.random() * 10) + 10 }
                    ],
                    websiteConversion: (Math.random() * 2 + 2).toFixed(1),
                    trialConversion: (Math.random() * 15 + 20).toFixed(1),
                    nps: Math.floor(Math.random() * 15) + 65,
                    brandAwareness: (Math.random() * 10 + 15).toFixed(1),
                    activationRate: (Math.random() * 10 + 40).toFixed(1),
                    timeToValue: Math.floor(Math.random() * 5) + 2,
                    viralCoefficient: (Math.random() * 0.4 + 0.3).toFixed(2),
                    bestPerformingContent: ['Product comparison guides', 'AI productivity tips', 'Remote work best practices', 'Case studies', 'Industry reports']
                };
                
                // Find best and worst performing channels
                const bestChannel = [...marketingMetrics.channels].sort((a, b) => a.cac - b.cac)[0];
                const worstChannel = [...marketingMetrics.channels].sort((a, b) => b.cac - a.cac)[0];
                const highestConvChannel = [...marketingMetrics.channels].sort((a, b) => parseFloat(b.convRate) - parseFloat(a.convRate))[0];
                
                const responses = [
                    `Let me share our marketing performance data that will strengthen our fundraising narrative. Our blended CAC is now $${marketingMetrics.channels.reduce((sum, channel) => sum + (channel.cac * channel.contribution/100), 0).toFixed(0)}, down 22% quarter-over-quarter. ${bestChannel.name} is our most efficient channel at $${bestChannel.cac} CAC with a ${bestChannel.convRate}% conversion rate, while ${worstChannel.name} is underperforming at $${worstChannel.cac}. Our activation rate has improved to ${marketingMetrics.activationRate}% since implementing our new onboarding flow, and users now reach their "aha moment" in just ${marketingMetrics.timeToValue} days, down from 9 days last quarter. With an NPS of ${marketingMetrics.nps} and a viral coefficient of ${marketingMetrics.viralCoefficient}, we're seeing strong product-led growth signals that would be compelling to investors.`,
                    
                    `From a marketing perspective, I've analyzed our funnel metrics in preparation for fundraising. Website visitor-to-trial conversion is at ${marketingMetrics.websiteConversion}%, and trial-to-paid conversion is ${marketingMetrics.trialConversion}%. Our most successful acquisition experiment was the ${highestConvChannel.name} campaign targeting product managers at mid-market SaaS companies, which achieved a ${highestConvChannel.convRate}% conversion rate and a CAC of $${highestConvChannel.cac}. This is 3.2x better than industry benchmarks. With additional funding, we can scale this channel and launch similar campaigns targeting our other high-LTV segments, potentially reducing our blended CAC by 30-35% while maintaining our current growth rate.`,
                    
                    `${speakerName}, to add to your point about our financial strategy, our marketing data shows we've found product-market fit in three distinct segments. Our ${marketingMetrics.bestPerformingContent[0]} and ${marketingMetrics.bestPerformingContent[1]} content pieces are generating 4,200+ qualified leads monthly with a 2.8x higher conversion rate than other content. Brand awareness has grown to ${marketingMetrics.brandAwareness}% among our target audience, up from 6% six months ago. I've mapped out a growth plan requiring $${Math.floor(Math.random() * 300) + 700}K in additional quarterly marketing spend that would allow us to expand into enterprise segments where ${companyContext.competitors[0]} and ${companyContext.competitors[1]} are weak, potentially accelerating our growth rate to ${companyContext.monthlyGrowth + Math.floor(Math.random() * 5) + 3}% MoM.`,
                    
                    `I've just completed our attribution analysis, and the data is compelling for our fundraising narrative. Our multi-touch attribution model shows that users who engage with our ${marketingMetrics.bestPerformingContent[2]} content before signing up have a 72% higher LTV and 38% lower churn rate. We've also discovered that our ideal customer profile has shifted - companies with 50-200 employees in the ${['SaaS', 'FinTech', 'HealthTech', 'EdTech'][Math.floor(Math.random() * 4)]} space are converting at 3.4x our average rate and expanding their usage 2.2x faster. With our current marketing budget, we're only capturing about 8% of this market. An additional $${Math.floor(Math.random() * 200) + 300}K monthly would allow us to dominate this segment before ${companyContext.competitors[2]} and ${companyContext.competitors[3]} recognize the opportunity.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else if (role.toLowerCase().includes('sales')) {
                thoughts.push('I need to provide specific pipeline metrics, conversion rates, and enterprise sales strategies with concrete examples of deals and customer segments.');
                
                // Create detailed sales metrics for a Series A SaaS startup
                const salesMetrics = {
                    pipeline: {
                        total: Math.floor(Math.random() * 1000) + 2000, // in thousands
                        stages: [
                            { name: 'Discovery', value: Math.floor(Math.random() * 400) + 800, deals: Math.floor(Math.random() * 20) + 40, convRate: (Math.random() * 20 + 60).toFixed(1) },
                            { name: 'Demo', value: Math.floor(Math.random() * 300) + 600, deals: Math.floor(Math.random() * 15) + 25, convRate: (Math.random() * 15 + 70).toFixed(1) },
                            { name: 'Proposal', value: Math.floor(Math.random() * 200) + 400, deals: Math.floor(Math.random() * 10) + 15, convRate: (Math.random() * 10 + 80).toFixed(1) },
                            { name: 'Negotiation', value: Math.floor(Math.random() * 150) + 200, deals: Math.floor(Math.random() * 5) + 8, convRate: (Math.random() * 5 + 90).toFixed(1) }
                        ]
                    },
                    segments: [
                        { name: 'SMB', avgDealSize: Math.floor(Math.random() * 5) + 10, salesCycle: Math.floor(Math.random() * 10) + 20, contribution: Math.floor(Math.random() * 20) + 40 },
                        { name: 'Mid-Market', avgDealSize: Math.floor(Math.random() * 15) + 25, salesCycle: Math.floor(Math.random() * 15) + 45, contribution: Math.floor(Math.random() * 15) + 35 },
                        { name: 'Enterprise', avgDealSize: Math.floor(Math.random() * 50) + 100, salesCycle: Math.floor(Math.random() * 30) + 90, contribution: Math.floor(Math.random() * 10) + 25 }
                    ],
                    keyAccounts: [
                        { name: 'Acme Corp', stage: 'Negotiation', value: Math.floor(Math.random() * 100) + 150, probability: Math.floor(Math.random() * 20) + 80 },
                        { name: 'TechGiant', stage: 'Proposal', value: Math.floor(Math.random() * 150) + 200, probability: Math.floor(Math.random() * 30) + 60 },
                        { name: 'Global Innovations', stage: 'Demo', value: Math.floor(Math.random() * 200) + 250, probability: Math.floor(Math.random() * 40) + 40 }
                    ],
                    metrics: {
                        winRate: (Math.random() * 15 + 25).toFixed(1),
                        avgSalesCycle: Math.floor(Math.random() * 20) + 40,
                        quotaAttainment: (Math.random() * 20 + 90).toFixed(1),
                        expansionRate: (Math.random() * 15 + 20).toFixed(1),
                        leadToOpportunityRate: (Math.random() * 10 + 15).toFixed(1)
                    }
                };
                
                // Calculate weighted pipeline value
                const weightedPipeline = salesMetrics.pipeline.stages.reduce((sum, stage) => {
                    const weight = parseFloat(stage.convRate) / 100;
                    return sum + (stage.value * weight);
                }, 0);
                
                // Get the largest deal and segment
                const largestDeal = [...salesMetrics.keyAccounts].sort((a, b) => b.value - a.value)[0];
                const highestValueSegment = [...salesMetrics.segments].sort((a, b) => b.avgDealSize - a.avgDealSize)[0];
                
                const responses = [
                    `Let me share our sales pipeline data that strengthens our fundraising position. We currently have $${salesMetrics.pipeline.total}K in total pipeline value across ${salesMetrics.pipeline.stages.reduce((sum, stage) => sum + stage.deals, 0)} active opportunities. Our weighted pipeline is $${weightedPipeline.toFixed(0)}K based on stage conversion probabilities. Our most significant opportunity is with ${largestDeal.name} at $${largestDeal.value}K with ${largestDeal.probability}% close probability in the next ${Math.floor(Math.random() * 4) + 2} weeks. We're seeing particularly strong traction in the ${highestValueSegment.name} segment with average deal sizes of $${highestValueSegment.avgDealSize}K, which is ${Math.floor(Math.random() * 30) + 50}% higher than last quarter. With our current win rate of ${salesMetrics.metrics.winRate}%, we're projecting $${(weightedPipeline * parseFloat(salesMetrics.metrics.winRate) / 100).toFixed(0)}K in new bookings next quarter.`,
                    
                    `From a sales perspective, our metrics have improved significantly in ways that will appeal to investors. Our average sales cycle has decreased from ${salesMetrics.metrics.avgSalesCycle + Math.floor(Math.random() * 15) + 10} to ${salesMetrics.metrics.avgSalesCycle} days, and our lead-to-opportunity conversion rate is now ${salesMetrics.metrics.leadToOpportunityRate}%, up from ${(parseFloat(salesMetrics.metrics.leadToOpportunityRate) - (Math.random() * 5 + 3)).toFixed(1)}% last quarter. We've identified that prospects who engage with our ${['AI assistant features', 'integration capabilities', 'analytics dashboard', 'collaboration tools', 'automation features'][Math.floor(Math.random() * 5)]} during the demo phase have a 2.3x higher close rate. I've restructured our sales process to emphasize these features earlier, which has already improved our demo-to-close ratio by 18%.`,
                    
                    `${speakerName}, to build on your point about funding, our sales data shows we're hitting an inflection point in the ${highestValueSegment.name} segment. We've closed ${Math.floor(Math.random() * 3) + 3} ${highestValueSegment.name} deals this quarter at an average of $${highestValueSegment.avgDealSize}K each, with expansion potential of 3-4x within 12 months. However, our current sales team is at 112% capacity, limiting our ability to pursue the $${Math.floor(Math.random() * 3000) + 5000}K in qualified ${highestValueSegment.name} opportunities we've identified. With funding, I'd immediately hire ${Math.floor(Math.random() * 3) + 4} additional account executives specializing in ${highestValueSegment.name} sales, which based on our current metrics would generate an additional $${Math.floor(Math.random() * 500) + 1000}K in ARR within two quarters.`,
                    
                    `Our competitive win rate tells a compelling story for investors. Against ${companyContext.competitors[0]}, we're winning ${Math.floor(Math.random() * 20) + 60}% of deals, primarily due to our ${companyContext.strengths[0]} and ${companyContext.strengths[2]}. We're currently engaged in ${Math.floor(Math.random() * 5) + 8} competitive enterprise deals worth $${Math.floor(Math.random() * 600) + 800}K in total contract value. The most strategic opportunity is with ${largestDeal.name}, which would not only add $${largestDeal.value}K in ARR but also give us a reference customer in the ${['financial services', 'healthcare', 'manufacturing', 'technology', 'retail'][Math.floor(Math.random() * 5)]} vertical where ${companyContext.competitors[1]} and ${companyContext.competitors[2]} have traditionally dominated. With additional investment in our sales engineering team and enterprise-grade features like ${['SSO', 'advanced permissions', 'compliance reporting', 'custom integrations', 'dedicated infrastructure'][Math.floor(Math.random() * 5)]}, we could increase our enterprise win rate by an estimated 15-20%.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else {
                thoughts.push('I should contribute a general but thoughtful perspective on our funding strategy.');
                
                const responses = [
                    `I think it's worth considering how additional funding would impact our company culture and priorities. As we think about raising money, we should be clear about what we're optimizing for - is it growth at all costs, or sustainable expansion with an eye toward profitability?`,
                    
                    `From my perspective working with our ${department || 'team'}, I see how additional resources could help us address some key challenges. At the same time, I think we should be strategic about how much we raise and from whom. The right investors could bring valuable expertise in ${currentTopic || 'our industry'}.`,
                    
                    `${speakerName}, you raised an important point about our financial strategy. I'd add that timing is crucial - the market conditions for fundraising seem favorable now, but we should also consider how our metrics will look in 3-6 months and whether waiting might put us in an even stronger position.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
        } 
        else if (triggerContent.toLowerCase().includes('product') || 
                 triggerContent.toLowerCase().includes('feature') || 
                 triggerContent.toLowerCase().includes('development')) {
            
            thoughts.push('This discussion is about product development or features.');
            
            if (role.toLowerCase().includes('product')) {
                thoughts.push('I need to provide specific product metrics, user insights, and a detailed roadmap with concrete feature priorities and timelines.');
                
                // Create detailed product metrics and roadmap for an AI productivity platform
                const productMetrics = {
                    activeUsers: {
                        daily: Math.floor(companyContext.users * 0.35),
                        weekly: Math.floor(companyContext.users * 0.65),
                        monthly: companyContext.users
                    },
                    engagement: {
                        avgSessionTime: Math.floor(Math.random() * 10) + 12, // minutes
                        sessionsPerUser: (Math.random() * 2 + 3).toFixed(1),
                        featureAdoption: (Math.random() * 15 + 60).toFixed(1), // percentage
                        criticalFeatures: ['AI Assistant', 'Document Collaboration', 'Task Management', 'Integrations', 'Analytics']
                    },
                    retention: {
                        day1: (Math.random() * 10 + 75).toFixed(1),
                        day7: (Math.random() * 15 + 55).toFixed(1),
                        day30: (Math.random() * 20 + 35).toFixed(1),
                        day90: (Math.random() * 15 + 25).toFixed(1)
                    },
                    userSegments: [
                        { name: 'Power Users', percentage: (Math.random() * 10 + 15).toFixed(1), retention: (Math.random() * 10 + 85).toFixed(1), growth: (Math.random() * 5 + 12).toFixed(1) },
                        { name: 'Regular Users', percentage: (Math.random() * 15 + 45).toFixed(1), retention: (Math.random() * 15 + 65).toFixed(1), growth: (Math.random() * 8 + 8).toFixed(1) },
                        { name: 'Occasional Users', percentage: (Math.random() * 15 + 25).toFixed(1), retention: (Math.random() * 20 + 40).toFixed(1), growth: (Math.random() * 5 + 3).toFixed(1) },
                        { name: 'At-Risk Users', percentage: (Math.random() * 10 + 5).toFixed(1), retention: (Math.random() * 15 + 10).toFixed(1), growth: (Math.random() * 2 - 5).toFixed(1) }
                    ],
                    roadmap: {
                        q1: [
                            { name: 'AI Assistant 2.0', impact: 'High', effort: 'High', status: 'In Progress', completion: (Math.random() * 30 + 60).toFixed(0) },
                            { name: 'Mobile App Redesign', impact: 'Medium', effort: 'Medium', status: 'In Progress', completion: (Math.random() * 40 + 30).toFixed(0) },
                            { name: 'API Expansion', impact: 'Medium', effort: 'Low', status: 'Completed', completion: '100' }
                        ],
                        q2: [
                            { name: 'Enterprise SSO', impact: 'High', effort: 'Medium', status: 'Planning', completion: '0' },
                            { name: 'Advanced Analytics', impact: 'High', effort: 'High', status: 'Research', completion: '15' },
                            { name: 'Collaboration Improvements', impact: 'Medium', effort: 'Medium', status: 'Design', completion: '25' }
                        ],
                        q3: [
                            { name: 'Offline Mode', impact: 'Medium', effort: 'High', status: 'Not Started', completion: '0' },
                            { name: 'Custom Workflows', impact: 'High', effort: 'High', status: 'Not Started', completion: '0' },
                            { name: 'Data Visualization Tools', impact: 'Medium', effort: 'Medium', status: 'Not Started', completion: '0' }
                        ]
                    },
                    userFeedback: {
                        nps: Math.floor(Math.random() * 15) + 65,
                        topRequests: ['Better mobile experience', 'More AI capabilities', 'Improved search', 'Better integrations', 'Customizable dashboards'],
                        painPoints: ['Onboarding complexity', 'Performance on large documents', 'Limited offline capabilities', 'Learning curve for advanced features']
                    }
                };
                
                // Find best performing feature and segment
                const bestSegment = [...productMetrics.userSegments].sort((a, b) => parseFloat(b.retention) - parseFloat(a.retention))[0];
                const mostRequestedFeature = productMetrics.userFeedback.topRequests[0];
                const highestImpactFeature = productMetrics.roadmap.q1.find(item => item.impact === 'High') || productMetrics.roadmap.q2.find(item => item.impact === 'High');
                
                const responses = [
                    `Let me walk through our product metrics and roadmap with specific data points. We currently have ${productMetrics.activeUsers.daily.toLocaleString()} DAUs and ${productMetrics.activeUsers.monthly.toLocaleString()} MAUs, with a DAU/MAU ratio of ${(productMetrics.activeUsers.daily/productMetrics.activeUsers.monthly).toFixed(2)}, which is ${(productMetrics.activeUsers.daily/productMetrics.activeUsers.monthly > 0.4) ? 'strong' : 'an area for improvement'} for our category. Our ${bestSegment.name} segment, which represents ${bestSegment.percentage}% of our user base, has a ${bestSegment.retention}% retention rate and is growing at ${bestSegment.growth}% month-over-month. Based on our user research and product analytics, we've prioritized three key initiatives for Q2: ${productMetrics.roadmap.q2[0].name}, which addresses enterprise customer needs; ${productMetrics.roadmap.q2[1].name}, which our data shows could improve retention by 12-15%; and ${productMetrics.roadmap.q2[2].name}, which directly addresses feedback from our ${bestSegment.name} segment. We've allocated 40% of our engineering resources to these initiatives, with expected delivery dates staggered throughout the quarter.`,
                    
                    `I've just completed our quarterly product analysis, and there are several insights relevant to our fundraising strategy. Our feature adoption rate is ${productMetrics.engagement.featureAdoption}%, with users spending an average of ${productMetrics.engagement.avgSessionTime} minutes per session across ${productMetrics.engagement.sessionsPerUser} sessions daily. The most significant finding is that users who adopt our ${productMetrics.engagement.criticalFeatures[0]} and ${productMetrics.engagement.criticalFeatures[1]} features have a 90-day retention rate of ${(parseFloat(productMetrics.retention.day90) + 15).toFixed(1)}%, compared to our overall 90-day retention of ${productMetrics.retention.day90}%. This validates our product strategy and shows clear product-market fit. Our roadmap is focused on expanding these sticky features, with ${highestImpactFeature?.name} currently at ${highestImpactFeature?.completion}% completion and expected to launch in ${highestImpactFeature?.status === 'In Progress' ? '4-6 weeks' : 'Q2'}. This feature directly addresses the most requested capability from our enterprise prospects and should significantly impact our conversion metrics.`,
                    
                    `${speakerName}, to build on your point about ${currentTopic || 'our growth strategy'}, our product data shows we're at an inflection point. Our NPS has increased from ${productMetrics.userFeedback.nps - 8} to ${productMetrics.userFeedback.nps} in the last quarter, and our activation rate (users who complete key actions in their first week) has improved by 22% since implementing our guided onboarding flow. We've identified that the biggest friction point preventing expansion is ${productMetrics.userFeedback.painPoints[0]}, which affects ${(parseFloat(productMetrics.userSegments[3].percentage) + parseFloat(productMetrics.userSegments[2].percentage)).toFixed(1)}% of our user base. I've restructured our Q2 roadmap to prioritize solving this, allocating 35% of our sprint capacity to building a solution that our user testing shows could improve activation by 30-35% and potentially increase conversion rates by 15-20%. This directly addresses feedback from ${companyContext.competitors[0]} and ${companyContext.competitors[1]} switchers, who cite this as their primary reason for evaluating our platform.`,
                    
                    `Our product strategy is centered around three key differentiators that our data shows drive retention and expansion. First, our AI capabilities, which have a 78% adoption rate among retained users versus 23% among churned users. Second, our integration ecosystem, which shows that users connecting 3+ tools have a ${(parseFloat(productMetrics.retention.day90) * 1.4).toFixed(1)}% 90-day retention rate. And third, our collaboration features, which drive a 2.8x increase in seat expansion within accounts. For Q2-Q3, we've mapped out 14 specific enhancements across these areas, with clear success metrics for each. The highest impact initiative is ${productMetrics.roadmap.q2[0].name}, which our enterprise prospects have explicitly requested in 72% of sales conversations. We're also addressing our primary competitive gap against ${companyContext.competitors[0]} by building ${productMetrics.roadmap.q2[1].name}, which our analysis shows could reduce competitive losses by 35-40% based on win/loss data from the last two quarters.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else if (role.toLowerCase().includes('dev') || role.toLowerCase().includes('engineer')) {
                thoughts.push('I should address technical considerations and engineering constraints.');
                
                const responses = [
                    `From an engineering perspective, we need to balance new feature development with technical sustainability. Our current technical debt is affecting our velocity. I propose we allocate ${Math.floor(Math.random() * 20) + 20}% of our sprint capacity to addressing infrastructure and code quality issues for the next quarter.`,
                    
                    `${speakerName}, regarding the product roadmap, I want to highlight some technical considerations. The ${['API enhancements', 'performance improvements', 'scalability updates', 'security hardening', 'integration framework'][Math.floor(Math.random() * 5)]} you mentioned would require significant architectural changes. We should plan for at least ${Math.floor(Math.random() * 2) + 2} sprints of focused work.`,
                    
                    `I've been analyzing our system performance, and we have some challenges to address before adding more features. Our ${['database queries', 'API response times', 'background job processing', 'caching layer', 'authentication system'][Math.floor(Math.random() * 5)]} is showing signs of strain as we scale. I've drafted a technical improvement plan we should consider implementing alongside the product roadmap.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else if (role.toLowerCase().includes('design')) {
                thoughts.push('I should provide insights on user experience and design considerations.');
                
                const responses = [
                    `From a design perspective, we've been conducting usability studies on the current interface. Users are struggling with the ${['navigation', 'information hierarchy', 'form completion', 'data visualization', 'mobile experience'][Math.floor(Math.random() * 5)]}. I've created some design concepts that address these issues while maintaining consistency with our brand.`,
                    
                    `Building on the product discussion, I'd like to share some user research insights. We've observed that users are trying to ${['collaborate more within the platform', 'access the system on mobile devices', 'integrate with other tools', 'customize their workflows', 'share and export data'][Math.floor(Math.random() * 5)]}, but our current design doesn't fully support these behaviors.`,
                    
                    `I've been working on a design system that would help us scale our UI development more efficiently. This would allow us to implement new features faster while maintaining a consistent user experience. I can share the prototype after this meeting for feedback.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
                
            } else {
                thoughts.push('I should provide a balanced perspective on product development priorities.');
                
                const responses = [
                    `I think we should consider the impact of new features on our existing users. While innovation is important, we need to ensure we're not disrupting workflows that our core users depend on. Perhaps we could implement an early access program to get feedback before full releases.`,
                    
                    `From my interactions with ${['customers', 'users', 'clients', 'the team', 'stakeholders'][Math.floor(Math.random() * 5)]}, I've noticed that ${['simplicity', 'reliability', 'performance', 'integration capabilities', 'mobile access'][Math.floor(Math.random() * 5)]} is often more valued than new features. We might want to focus on perfecting our core experience before expanding functionality.`,
                    
                    `${speakerName}, you raised some good points about product development. I'd add that we should also consider the training and support implications of new features. Each addition increases complexity for our customer success team and potentially for users as well.`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
        }
        else if (triggerContent.toLowerCase().includes('team') || 
                 triggerContent.toLowerCase().includes('hire') || 
                 triggerContent.toLowerCase().includes('staff')) {
            
            if (role.toLowerCase().includes('hr') || role.toLowerCase().includes('people')) {
                response = `We currently have 5 open positions across engineering, product, and sales. Our hiring pipeline is healthy, but we're facing competition for senior talent in this market.`;
            } else if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('director')) {
                response = `My team needs additional resources to meet our Q3 objectives. I'd like to discuss prioritizing a senior hire for the ${role.split(' ')[0]} team.`;
            } else {
                response = `I think we should be strategic about our hiring plan. We should focus on roles that directly impact our core metrics and revenue growth.`;
            }
        }
        // If someone asks a direct question
        else if (triggerContent.toLowerCase().includes('?') || 
                 triggerContent.toLowerCase().includes('what do you think') || 
                 triggerContent.toLowerCase().includes('your thoughts') ||
                 triggerContent.toLowerCase().includes('can you') ||
                 triggerContent.toLowerCase().includes('would you') ||
                 triggerContent.toLowerCase().includes('say anything')) {
            
            if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('chief')) {
                response = `From my perspective as ${role}, I think we need to focus on three priorities: accelerating our revenue growth, improving our product-market fit, and building a sustainable competitive advantage. I'd like to hear more specific ideas on how we can achieve these goals.`;
            } else if (role.toLowerCase().includes('cto') || role.toLowerCase().includes('tech')) {
                response = `I believe we should invest more in our technical infrastructure. Our current systems won't scale with our projected growth. I propose allocating additional resources to refactor our backend services and improve our deployment pipeline.`;
            } else if (role.toLowerCase().includes('product')) {
                response = `Based on recent user research, we should prioritize improving our onboarding flow. We're seeing a 30% drop-off in the first week, which is significantly impacting our retention metrics. I've drafted a plan to address this issue.`;
            } else if (role.toLowerCase().includes('market')) {
                response = `Our latest marketing campaigns show promising results. The ROI on our digital channels has increased by 25% quarter-over-quarter. I recommend doubling down on content marketing and SEO, which are driving our most qualified leads.`;
            } else if (role.toLowerCase().includes('sales')) {
                response = `We're seeing strong interest from the enterprise segment. Our sales cycle is averaging 45 days, which is better than industry standard. I believe we should expand our sales team to capitalize on this momentum.`;
            } else {
                response = `I think we should focus on improving cross-team collaboration. There are several initiatives where we could benefit from better alignment. Perhaps we could implement a more structured project management approach?`;
            }
        }
        // Default responses if no specific topic is detected
        else {
            // Different response styles based on role
            if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('chief')) {
                response = generateExecutiveResponse(name, triggerContent, speakerName, currentTopic, stage);
            } else if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('director')) {
                response = generateManagerResponse(name, triggerContent, speakerName, currentTopic, stage);
            } else if (role.toLowerCase().includes('dev') || role.toLowerCase().includes('engineer')) {
                response = generateTechnicalResponse(name, triggerContent, speakerName, currentTopic, stage);
            } else if (role.toLowerCase().includes('design')) {
                response = generateDesignResponse(name, triggerContent, speakerName, currentTopic, stage);
            } else if (role.toLowerCase().includes('market')) {
                response = generateMarketingResponse(name, triggerContent, speakerName, currentTopic, stage);
            } else {
                response = generateGeneralResponse(name, role, triggerContent, speakerName, currentTopic, stage);
            }
        }
        
        // Reference pre-meeting summary in responses occasionally
        if (preMeetingSummary && Math.random() > 0.7) {
            response += ` As we discussed in our pre-meeting summary, ${objectives || 'this is an important topic for our team'}.`;
        }
        
        // Include personal objectives if in conclusion stage
        if (stage === 'conclusion' && objectives) {
            response += ` Based on my objectives for this meeting, I'd like to commit to ${objectives.split('.')[0].toLowerCase()}.`;
        }
        
        return response;
    }
    
    function getRolePriorities(role: string) {
        const roleLower = role.toLowerCase();
        
        if (roleLower.includes('ceo') || roleLower.includes('founder') || roleLower.includes('president')) {
            return 'company vision, growth strategy, investor relations, and overall business health';
        } else if (roleLower.includes('cto') || roleLower.includes('tech') || roleLower.includes('engineering')) {
            return 'technical architecture, development roadmap, and engineering team productivity';
        } else if (roleLower.includes('cfo') || roleLower.includes('finance')) {
            return 'financial health, fundraising strategy, burn rate, and runway management';
        } else if (roleLower.includes('cmo') || roleLower.includes('marketing')) {
            return 'brand awareness, customer acquisition, marketing ROI, and growth metrics';
        } else if (roleLower.includes('sales')) {
            return 'revenue growth, sales pipeline, customer relationships, and market expansion';
        } else if (roleLower.includes('product')) {
            return 'product roadmap, user experience, feature prioritization, and market fit';
        } else if (roleLower.includes('design')) {
            return 'user interface, brand consistency, and design systems';
        } else if (roleLower.includes('hr') || roleLower.includes('people')) {
            return 'team culture, talent acquisition, and employee development';
        } else if (roleLower.includes('operations')) {
            return 'operational efficiency, process optimization, and scalability';
        } else {
            return 'contributing my expertise and supporting team objectives';
        }
    }
    
    function detectTopics(text: string) {
        const topics = [];
        
        // Common business topics to detect
        const topicKeywords = {
            'budget': ['budget', 'cost', 'expense', 'financial', 'funding', 'money'],
            'timeline': ['timeline', 'deadline', 'schedule', 'date', 'time frame'],
            'resources': ['resources', 'staff', 'personnel', 'team size', 'hiring'],
            'strategy': ['strategy', 'plan', 'approach', 'direction', 'vision'],
            'product': ['product', 'feature', 'release', 'launch', 'development'],
            'customers': ['customer', 'client', 'user', 'feedback', 'satisfaction'],
            'marketing': ['marketing', 'promotion', 'campaign', 'advertising', 'brand'],
            'technical': ['technical', 'architecture', 'infrastructure', 'code', 'development'],
            'design': ['design', 'UI', 'UX', 'interface', 'user experience'],
            'competition': ['competition', 'competitor', 'market', 'industry', 'landscape']
        };
        
        // Check for each topic
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
                topics.push(topic);
            }
        }
        
        // If no specific topics detected, use meeting stage as fallback
        if (topics.length === 0) {
            if (meetingStage === 'intro') topics.push('meeting objectives');
            else if (meetingStage === 'discussion') topics.push('main discussion');
            else if (meetingStage === 'conclusion') topics.push('action items');
        }
        
        return topics;
    }
    
    function generateExecutiveResponse(name: string, trigger: string, speaker: string, topic: string, stage: string) {
        const responses = [
            `I appreciate ${speaker}'s perspective on ${topic}. From a strategic standpoint, we need to ensure this aligns with our quarterly objectives.`,
            `${speaker} raises an important point. Looking at the big picture, how does this impact our market position?`,
            `Let's focus on outcomes here. What specific results can we expect if we pursue this direction?`,
            `I want to make sure we're addressing the core business value. How will this affect our bottom line?`,
            `We need to consider the resource implications of what ${speaker} is suggesting. Do we have the capacity to execute on this?`
        ];
        
        if (stage === 'intro') {
            return `Thank you for bringing this up. As we begin, I'd like us to keep our key priorities in mind: growth, innovation, and customer satisfaction.`;
        } else if (stage === 'conclusion') {
            return `As we wrap up, I want to ensure we have clear ownership and timelines for these action items. Who's taking point on this initiative?`;
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function generateManagerResponse(name: string, trigger: string, speaker: string, topic: string, stage: string) {
        const responses = [
            `Building on what ${speaker} said about ${topic}, my team has been working on addressing this through our current sprint.`,
            `I see the value in ${speaker}'s point. From my team's perspective, we need to consider the implementation timeline.`,
            `${speaker} makes a good point. I'd like to add that we should also consider how this affects our team's current workload.`,
            `I've been tracking our progress on related initiatives, and I think we can integrate this into our existing workflow.`,
            `My concern with ${speaker}'s suggestion is resource allocation. We're already stretched thin on several projects.`
        ];
        
        if (stage === 'intro') {
            return `From my department's perspective, we're ready to discuss how we can contribute to these objectives.`;
        } else if (stage === 'conclusion') {
            return `I'll make sure my team understands their responsibilities here. We can start implementation as early as next week.`;
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function generateTechnicalResponse(name: string, trigger: string, speaker: string, topic: string, stage: string) {
        const responses = [
            `From a technical standpoint, what ${speaker} is suggesting would require significant backend changes.`,
            `I've been looking into solutions for this. We could leverage our existing architecture with some modifications.`,
            `The technical challenge here isn't insurmountable, but we should be aware of potential integration issues with our current systems.`,
            `If we're going to implement what ${speaker} is suggesting, we'll need to consider the impact on our tech stack.`,
            `I can start prototyping a solution for this. Initial estimates put development time at about two weeks.`
        ];
        
        if (stage === 'intro') {
            return `From an engineering perspective, I'm interested in discussing how we can build scalable solutions for these challenges.`;
        } else if (stage === 'conclusion') {
            return `I'll document the technical requirements and create tickets in our project management system by tomorrow.`;
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function generateDesignResponse(name: string, trigger: string, speaker: string, topic: string, stage: string) {
        const responses = [
            `From a user experience perspective, we should consider how this affects the customer journey.`,
            `I've been working on some wireframes that might address what ${speaker} is talking about.`,
            `User testing has shown that this area is particularly important to our core demographic.`,
            `We could approach this with a design sprint to quickly iterate on solutions.`,
            `The visual language we use here needs to be consistent with our brand guidelines.`
        ];
        
        if (stage === 'intro') {
            return `I'm excited to share some design insights that could help us achieve these objectives while enhancing user satisfaction.`;
        } else if (stage === 'conclusion') {
            return `I'll prepare some mockups based on our discussion and share them with the team by the end of the week.`;
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function generateMarketingResponse(name: string, trigger: string, speaker: string, topic: string, stage: string) {
        const responses = [
            `Our market research aligns with what ${speaker} is saying. The data shows strong customer interest in this area.`,
            `We could create a targeted campaign to address this, focusing on the value proposition ${speaker} mentioned.`,
            `From a brand perspective, this initiative would strengthen our position as an industry leader.`,
            `I see an opportunity to leverage this in our content strategy across multiple channels.`,
            `Customer feedback has consistently highlighted this as an area of interest.`
        ];
        
        if (stage === 'intro') {
            return `From a marketing standpoint, I'm interested in how these initiatives can strengthen our brand messaging and customer engagement.`;
        } else if (stage === 'conclusion') {
            return `I'll coordinate with our content team to develop messaging that supports this initiative and aligns with our overall strategy.`;
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function generateGeneralResponse(name: string, role: string, trigger: string, speaker: string, topic: string, stage: string) {
        const responses = [
            `I agree with ${speaker}'s assessment of the situation. From my perspective as ${role}, we should also consider the broader implications.`,
            `Building on what ${speaker} said, I think we have an opportunity to innovate in this area.`,
            `I've been researching this topic, and there are several approaches we could take to address it effectively.`,
            `${speaker} raises an important point. I'd like to add that we should also consider the long-term sustainability of this solution.`,
            `I see both challenges and opportunities in what ${speaker} is suggesting. We should weigh these carefully.`
        ];
        
        if (stage === 'intro') {
            return `As ${role}, I'm looking forward to contributing to our discussion and finding ways to support our objectives.`;
        } else if (stage === 'conclusion') {
            return `I'll take responsibility for following up on the aspects related to my area and will provide updates at our next meeting.`;
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function toggleSimulation(participantId: string) {
        simulatedParticipants = {
            ...simulatedParticipants,
            [participantId]: !simulatedParticipants[participantId]
        };
    }
    
    function handlePromptContinuation(event: CustomEvent) {
        if (!event.detail || !event.detail.participant || isGeneratingResponse) return;
        
        const { participant, lastSpeaker, topic, conversationNeeded } = event.detail;
        currentTopic = topic; // Update the current topic based on conversation
        
        // Generate a follow-up response from this participant
        isGeneratingResponse = true;
        
        // Create a more contextually rich trigger message based on conversation state
        let triggerContent = `[Let's hear more about ${topic} from ${participant.employee?.name}]`;
        
        // If we have additional conversation context, use it to create a more specific prompt
        if (conversationNeeded) {
            if (conversationNeeded.needsDecision) {
                triggerContent = `[We need to make a decision about ${topic}. ${participant.employee?.name}, what's your recommendation?]`;
            } else if (conversationNeeded.hasOpenQuestion) {
                triggerContent = `[There's an open question about ${topic}. ${participant.employee?.name}, can you provide some insight?]`;
            } else if (conversationNeeded.needsExpertise) {
                triggerContent = `[We need some technical expertise on ${topic}. ${participant.employee?.name}, what's your perspective?]`;
            } else if (conversationNeeded.meetingStage === 'conclusion') {
                triggerContent = `[As we wrap up our discussion on ${topic}, ${participant.employee?.name}, can you summarize the key points and next steps?]`;
            }
        }
        
        const triggerMessage = {
            participant: lastSpeaker,
            content: triggerContent,
            timestamp: new Date().toISOString()
        };
        
        // Generate the follow-up response
        setTimeout(() => {
            const response = generateContextualResponse(
                participant,
                triggerMessage,
                messages,
                meetingStage,
                meeting
            );
            
            // Add the AI response
            const aiMessage = {
                id: Date.now().toString(),
                participant: participant,
                content: response,
                timestamp: new Date().toISOString(),
                isAI: true
            };
            
            messages = [...messages, aiMessage];
            transcript += `${participant.employee?.name}: ${response}\n`;
            isGeneratingResponse = false;
        }, 500);
    }
    
    function getStagePrompt() {
        switch (meetingStage) {
            case 'intro':
                return 'Begin the meeting by introducing the objectives.';
            case 'discussion':
                return 'Discuss the main topics and challenges.';
            case 'conclusion':
                return 'Summarize key points and assign action items.';
            default:
                return '';
        }
    }
    
    async function endMeeting() {
        try {
            // Finalize the transcript with a conclusion marker
            transcript += '\n--- MEETING CONCLUDED ---\n';
            
            // Update the meeting with the transcript
            const { error: updateError } = await supabase
                .from('team_meetings')
                .update({
                    transcript,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', meeting.id);
                
            if (updateError) throw updateError;
            
            // Generate AI summary based on transcript
            dispatch('generateSummary', { 
                type: 'post',
                transcript
            });
            
            // Close the meeting room
            dispatch('close');
        } catch (err: any) {
            console.error('Error ending meeting:', err);
            error = err.message;
        }
    }
</script>

<div class="meeting-room">
    <div class="meeting-header">
        <div class="meeting-info">
            <h2>{meeting.title}</h2>
            <div class="meeting-timer">
                <span class="timer">{formatTime(elapsedTime)}</span>
                <span class="stage">Stage: {meetingStage}</span>
            </div>
        </div>
        <div class="meeting-actions">
            {#if meeting.pre_meeting_summary}
                <button class="view-summary-button" on:click={() => showPreMeetingSummary = !showPreMeetingSummary}>
                    {showPreMeetingSummary ? 'Hide Summary' : 'View Pre-Meeting Summary'}
                </button>
            {/if}
            <button class="end-meeting-button" on:click={endMeeting}>
                End Meeting
            </button>
        </div>
    </div>
    
    {#if showPreMeetingSummary && meeting.pre_meeting_summary}
        <div class="pre-meeting-summary">
            <h3>Pre-Meeting Summary</h3>
            <div class="summary-content">
                {#each meeting.pre_meeting_summary.split('\n') as line}
                    {#if line.trim().startsWith('#')}
                        <h4>{line.replace(/^#+\s*/, '')}</h4>
                    {:else if line.trim().startsWith('##')}
                        <h5>{line.replace(/^#+\s*/, '')}</h5>
                    {:else if line.trim().startsWith('-')}
                        <div class="list-item">{line}</div>
                    {:else if line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.') || line.trim().startsWith('5.')}
                        <div class="list-item">{line}</div>
                    {:else if line.trim()}
                        <p>{line}</p>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
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
    
    <div class="meeting-content">
        <div class="participants-panel">
            <h3>Participants</h3>
            <div class="participants-list">
                {#each participants as participant}
                    <div 
                        class="participant-item {activeParticipant?.id === participant.id ? 'active' : ''}" 
                        on:click={() => selectParticipant(participant)}
                        on:keydown={(e) => e.key === 'Enter' && selectParticipant(participant)}
                        role="button"
                        tabindex="0"
                    >
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
                        <div class="participant-actions">
                            <button 
                                class="context-button" 
                                on:click|stopPropagation={() => showParticipantContext(participant)}
                                title="View participant context"
                                aria-label="View context for {participant.employee?.name}"
                            >
                                <i class="fas fa-info-circle"></i>
                            </button>
                            <label class="simulate-toggle" title="Enable AI simulation for this participant">
                                <input 
                                    type="checkbox" 
                                    checked={simulatedParticipants[participant.id] || false}
                                    on:change={() => toggleSimulation(participant.id)}
                                />
                                <span class="checkmark"></span>
                                <span class="toggle-label">Simulate</span>
                            </label>
                        </div>
                    </div>
                {/each}
            </div>
            
            <div class="stage-prompt">
                <h4>Current Stage: {meetingStage}</h4>
                <p>{getStagePrompt()}</p>
            </div>
        </div>
        
        <div class="meeting-table">
            <div class="table-visualization">
                <div class="table-center"></div>
                {#each participants as participant, i}
                    {@const angle = (i * (360 / participants.length)) * (Math.PI / 180)}
                    {@const x = 120 * Math.cos(angle) + 150}
                    {@const y = 120 * Math.sin(angle) + 150}
                    <div 
                        class="table-participant {activeParticipant?.id === participant.id ? 'active' : ''}" 
                        style="left: {x}px; top: {y}px;"
                        on:click={() => selectParticipant(participant)}
                        on:keydown={(e) => e.key === 'Enter' && selectParticipant(participant)}
                        role="button"
                        tabindex="0"
                    >
                        <div class="participant-avatar">
                            {participant.employee?.name?.charAt(0) || '?'}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        
        <div class="resize-handle" id="transcript-resize-handle"></div>
        
        <div class="transcript-panel">
            <h3>Meeting Transcript</h3>
            <div class="messages-container">
                {#each messages as message}
                    <div class="message {message.isAI ? 'ai-response' : ''}">
                        <div class="message-header">
                            <span class="message-sender">{message.participant.employee.name}</span>
                            <span class="message-time">
                                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                {#if message.isAI}
                                    <span class="ai-badge">AI</span>
                                {/if}
                            </span>
                        </div>
                        <div class="message-content">
                            {message.content}
                        </div>
                    </div>
                {/each}
            </div>
            
            <div class="message-input">
                <div class="active-speaker">
                    {#if activeParticipant}
                        Speaking as: <strong>{activeParticipant.employee.name}</strong>
                    {:else}
                        Select a participant to speak
                    {/if}
                </div>
                <div class="input-container">
                    <textarea 
                        bind:value={newMessage}
                        placeholder={activeParticipant ? "Type your message..." : "Select a participant first"}
                        disabled={!activeParticipant}
                        on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && (addMessage(), e.preventDefault())}
                    ></textarea>
                    <button 
                        class="send-button"
                        disabled={!activeParticipant || !newMessage.trim()}
                        on:click={addMessage}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<ParticipantContextModal 
    participant={selectedContextParticipant}
    meeting={meeting}
    bind:show={showContextModal}
    simulatedParticipants={simulatedParticipants}
/>

<MeetingCoordinator
    bind:this={meetingCoordinator}
    {participants}
    {messages}
    {activeParticipant}
    {meetingStage}
    {currentTopic}
    {simulatedParticipants}
    on:suggest={event => {
        if (autoSuggestSpeakers && !activeParticipant) {
            selectParticipant(event.detail.participant);
        }
    }}
    on:prompt-continuation={handlePromptContinuation}
/>

<style>
    .meeting-room {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--surface-1, #ffffff);
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .meeting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--surface-2, #f3f4f6);
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    
    .meeting-info h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
    }
    
    .meeting-timer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .timer {
        font-family: monospace;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .stage {
        padding: 0.25rem 0.5rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
    }
    
    .end-meeting-button {
        padding: 0.5rem 1rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
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
        margin: 1rem;
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
    
    .meeting-content {
        flex: 1;
        display: flex;
        gap: 1rem;
        padding: 1rem;
        height: calc(100% - 80px);
        position: relative;
    }
    
    .participants-panel {
        width: 250px;
        flex-shrink: 0;
    }
    
    .meeting-table {
        flex: 1;
    }
    
    .resize-handle {
        width: 8px;
        background-color: var(--border-color, #e5e7eb);
        cursor: col-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }
    
    .resize-handle:hover {
        background-color: var(--surface-3, #3b82f6);
    }
    
    .resize-handle::after {
        content: "";
        width: 2px;
        height: 30px;
        background-color: #ffffff;
        border-radius: 1px;
    }
    
    .transcript-panel {
        width: 300px;
        flex-shrink: 0;
        max-width: 50%;
        min-width: 200px;
    }
    
    .participants-panel {
        background: var(--surface-1, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
    }
    
    .participants-panel h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
    }
    
    .participants-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
        overflow-y: auto;
    }
    
    .participant-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .participant-item:hover {
        background: var(--surface-2, #f3f4f6);
    }
    
    .participant-item.active {
        background: #ebf5ff;
        border-color: var(--surface-3, #3b82f6);
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
        font-size: 0.75rem;
        color: var(--text-2, #6b7280);
    }
    
    .participant-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .context-button {
        background: none;
        border: none;
        color: var(--text-2, #6b7280);
        cursor: pointer;
        font-size: 1rem;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
    }
    
    .context-button:hover {
        color: var(--surface-3, #3b82f6);
    }
    
    .simulate-toggle {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 0.75rem;
        color: var(--text-2, #6b7280);
        user-select: none;
    }
    
    .simulate-toggle input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }
    
    .checkmark {
        position: relative;
        display: inline-block;
        height: 16px;
        width: 16px;
        background-color: var(--surface-2, #f3f4f6);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 3px;
        margin-right: 4px;
    }
    
    .simulate-toggle:hover input ~ .checkmark {
        background-color: var(--surface-2, #e5e7eb);
    }
    
    .simulate-toggle input:checked ~ .checkmark {
        background-color: var(--surface-3, #3b82f6);
        border-color: var(--surface-3, #3b82f6);
    }
    
    .checkmark:after {
        content: "";
        position: absolute;
        display: none;
    }
    
    .simulate-toggle input:checked ~ .checkmark:after {
        display: block;
    }
    
    .simulate-toggle .checkmark:after {
        left: 5px;
        top: 2px;
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
    }
    
    .toggle-label {
        margin-left: 2px;
    }
    
    .stage-prompt {
        margin-top: auto;
        padding: 1rem;
        background: var(--surface-2, #f3f4f6);
        border-radius: 0.375rem;
    }
    
    .stage-prompt h4 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        text-transform: capitalize;
    }
    
    .stage-prompt p {
        font-size: 0.875rem;
        margin: 0;
        color: var(--text-2, #6b7280);
    }
    
    .meeting-table {
        background: var(--surface-1, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .table-visualization {
        position: relative;
        width: 300px;
        height: 300px;
    }
    
    .table-center {
        position: absolute;
        width: 200px;
        height: 200px;
        background: var(--surface-2, #f3f4f6);
        border-radius: 50%;
        top: 50px;
        left: 50px;
    }
    
    .table-participant {
        position: absolute;
        cursor: pointer;
        transition: transform 0.2s;
    }
    
    .table-participant:hover {
        transform: scale(1.1);
    }
    
    .table-participant.active .participant-avatar {
        box-shadow: 0 0 0 3px var(--surface-3, #3b82f6);
    }
    
    .transcript-panel {
        background: var(--surface-1, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
    }
    
    .transcript-panel h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
    }
    
    .messages-container {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    
    .message {
        padding: 0.75rem;
        background: var(--surface-2, #f3f4f6);
        border-radius: 0.375rem;
    }
    
    .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }
    
    .message-sender {
        font-weight: 500;
        color: var(--text-1, #111827);
    }
    
    .message-time {
        font-size: 0.75rem;
        color: var(--text-2, #6b7280);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .ai-badge {
        font-size: 0.625rem;
        font-weight: 500;
        padding: 0.125rem 0.25rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border-radius: 4px;
    }
    
    .message-content {
        color: var(--text-1, #111827);
        white-space: pre-wrap;
    }
    
    .message.ai-response {
        background: var(--surface-2, #f3f4f6);
        border-left: 3px solid var(--surface-3, #3b82f6);
    }
    
    .message-input {
        margin-top: auto;
    }
    
    .active-speaker {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
    }
    
    .input-container {
        display: flex;
        gap: 0.5rem;
    }
    
    textarea {
        flex: 1;
        padding: 0.625rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.375rem;
        resize: none;
        height: 80px;
    }
    
    .send-button {
        padding: 0.5rem 1rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        align-self: flex-end;
    }
    
    .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .meeting-header {
            background: var(--surface-2, #374151);
        }
        
        .error {
            background: #7f1d1d;
            border-color: #b91c1c;
            color: #fee2e2;
        }
        
        .close-error {
            color: #fee2e2;
        }
        
        .participant-item:hover {
            background: var(--surface-2, #374151);
        }
        
        .participant-item.active {
            background: #1e3a8a;
        }
        
        .stage-prompt {
            background: var(--surface-2, #374151);
        }
        
        .table-center {
            background: var(--surface-2, #374151);
        }
        
        .message {
            background: var(--surface-2, #374151);
        }
    }
</style>