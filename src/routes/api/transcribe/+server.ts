import { AssemblyAI } from 'assemblyai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const client = new AssemblyAI({
    apiKey: env.ASSEMBLY_AI_KEY
});

// Helper function to wait for transcription completion
async function waitForTranscript(transcriptId: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        const transcript = await client.transcripts.get(transcriptId);
        console.log('Transcript status:', transcript.status);
        
        if (transcript.status === 'completed') {
            return transcript;
        }
        
        if (transcript.status === 'error') {
            throw new Error(transcript.error || 'Transcription failed');
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Transcription timed out');
}

export const POST = (async ({ request }) => {
    try {
        console.log('Starting transcription request...');
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        
        if (!audioFile) {
            console.error('No audio file provided');
            return new Response(JSON.stringify({ error: 'No audio file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Audio file received:', {
            size: audioFile.size,
            type: audioFile.type,
            name: audioFile.name
        });

        // Convert File to ArrayBuffer
        const buffer = await audioFile.arrayBuffer();
        console.log('Audio buffer created, size:', buffer.byteLength);

        try {
            // Upload the audio file to AssemblyAI
            console.log('Uploading to AssemblyAI...');
            
            // Convert ArrayBuffer to Buffer for upload
            const uploadBuffer = Buffer.from(buffer);
            console.log('Upload buffer created, size:', uploadBuffer.length);
            
            const uploadUrl = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    'authorization': env.ASSEMBLY_AI_KEY,
                    'content-type': 'application/octet-stream'
                },
                body: uploadBuffer
            }).then(res => res.json()).then(data => data.upload_url);

            if (!uploadUrl) {
                throw new Error('Failed to get upload URL from AssemblyAI');
            }

            console.log('Upload successful, URL:', uploadUrl);

            // Start transcription
            console.log('Starting transcription...');
            const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: {
                    'authorization': env.ASSEMBLY_AI_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    audio_url: uploadUrl,
                    language_code: 'en'
                })
            }).then(res => res.json());

            if (!transcriptResponse.id) {
                throw new Error('Failed to start transcription');
            }

            console.log('Transcription started, polling for completion...');
            
            // Poll for completion
            let transcript;
            for (let i = 0; i < 30; i++) {
                transcript = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptResponse.id}`, {
                    headers: {
                        'authorization': env.ASSEMBLY_AI_KEY
                    }
                }).then(res => res.json());

                if (transcript.status === 'completed') {
                    break;
                }

                if (transcript.status === 'error') {
                    throw new Error(transcript.error || 'Transcription failed');
                }

                // Wait 1 second before checking again
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (!transcript || transcript.status !== 'completed') {
                throw new Error('Transcription timed out');
            }

            console.log('Transcription completed successfully');

            return json({
                text: transcript.text || '',
                confidence: transcript.confidence,
                status: transcript.status
            });
        } catch (uploadError: any) {
            console.error('AssemblyAI API error:', {
                message: uploadError.message,
                response: uploadError.response?.data,
                status: uploadError.response?.status,
                stack: uploadError.stack
            });

            // Check for specific error types
            if (uploadError.response?.status === 413) {
                return new Response(JSON.stringify({ 
                    error: 'Audio file too large',
                    details: 'Please try a shorter recording'
                }), {
                    status: 413,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (uploadError.message.includes('timeout')) {
                return new Response(JSON.stringify({ 
                    error: 'Transcription took too long',
                    details: 'Please try again with a shorter recording'
                }), {
                    status: 408,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            throw uploadError;
        }
    } catch (error: any) {
        console.error('AssemblyAI transcription error:', {
            message: error.message,
            code: error.code,
            status: error.status,
            body: error.body,
            stack: error.stack
        });

        return new Response(JSON.stringify({ 
            error: error.message || 'Failed to transcribe audio',
            details: error.body || error.toString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}) satisfies RequestHandler;
