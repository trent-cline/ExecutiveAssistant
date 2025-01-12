import { AssemblyAI } from 'assemblyai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const client = new AssemblyAI({
    apiKey: env.ASSEMBLY_AI_KEY
});

export const POST = (async ({ request }) => {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        
        if (!audioFile) {
            return new Response(JSON.stringify({ error: 'No audio file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Upload the audio file to AssemblyAI
        const uploadResponse = await client.files.upload(await audioFile.arrayBuffer());

        // Start transcription
        const config = {
            audio_url: uploadResponse.url,
            language_code: 'en',
        };

        const transcript = await client.transcripts.transcribe(config);

        return json({
            text: transcript.text,
            confidence: transcript.confidence,
            status: transcript.status
        });
    } catch (error: any) {
        console.error('AssemblyAI transcription error:', error);
        return new Response(JSON.stringify({ 
            error: error.message || 'Failed to transcribe audio'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}) satisfies RequestHandler;
