import { AssemblyAI } from 'assemblyai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const client = new AssemblyAI({
    apiKey: env.ASSEMBLY_AI_KEY
});

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

        console.log('Audio file received, size:', audioFile.size, 'type:', audioFile.type);

        // Convert File to ArrayBuffer
        const buffer = await audioFile.arrayBuffer();
        console.log('Audio buffer created, size:', buffer.byteLength);

        // Upload the audio file to AssemblyAI
        console.log('Uploading to AssemblyAI...');
        const uploadResponse = await client.files.upload(buffer, {
            contentType: audioFile.type
        });
        console.log('Upload successful, URL:', uploadResponse.url);

        // Start transcription
        console.log('Starting transcription...');
        const config = {
            audio_url: uploadResponse.url,
            language_code: 'en',
        };

        const transcript = await client.transcripts.transcribe(config);
        console.log('Transcription complete:', transcript.status);

        if (transcript.status === 'error') {
            throw new Error(transcript.error || 'Transcription failed');
        }

        return json({
            text: transcript.text,
            confidence: transcript.confidence,
            status: transcript.status
        });
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
