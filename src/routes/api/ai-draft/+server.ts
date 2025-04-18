import type { RequestHandler } from '@sveltejs/kit';
import { OpenAI } from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
  const { prompt, direction, oneParagraph } = await request.json();
  if (!prompt) {
    return new Response('Prompt (story) required', { status: 400 });
  }

  // Compose the AI messages
  let messages = [
    {
      role: 'system',
      content:
        'You are a creative, engaging writing companion. Continue the user\'s story or idea in a compelling, readable way. DO NOT use markdown, code blocks, or triple backticks in your response. Output plain, readable story text.' +
        (oneParagraph ? ' Only generate one new paragraph and then stop.' : '')
    }
  ];
  if (prompt && prompt.trim()) {
    messages.push({ role: 'user', content: 'Story so far: ' + prompt });
  }
  if (direction && direction.trim()) {
    messages.push({ role: 'user', content: 'Instructions for next section: ' + direction });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          stream: true,
          temperature: 0.85,
          max_tokens: 1024
        });
        for await (const chunk of completion) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};
