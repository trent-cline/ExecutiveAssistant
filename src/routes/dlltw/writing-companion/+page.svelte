<script lang="ts">
import { onMount } from 'svelte';
import { writable } from 'svelte/store';

const story = writable('');
const direction = writable('');
const aiDrafting = writable(false);
const paused = writable(true);
const typingSpeed = writable(40); // ms per character
const oneParagraph = writable(false);
let abortController: AbortController | null = null;

onMount(() => {
  const url = new URL(window.location.href);
  const prompt = url.searchParams.get('prompt');
  const directionParam = url.searchParams.get('direction');
  if (prompt) {
    story.set(prompt);
  }
  if (directionParam) {
    direction.set(directionParam);
  }
});

async function startAIDrafting() {
  aiDrafting.set(true);
  paused.set(false);
  abortController = new AbortController();
  const storyValue = $story;
  const directionValue = $direction;
  const stopAtParagraph = $oneParagraph;

  try {
    const res = await fetch('/api/ai-draft', {
      method: 'POST',
      body: JSON.stringify({
        prompt: storyValue,
        direction: directionValue,
        oneParagraph: stopAtParagraph
      }),
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.signal
    });
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    let text = storyValue;
    let decoder = new TextDecoder();
    let done = false;
    while (!done) {
      if ($paused) {
        await new Promise(r => setTimeout(r, 100));
        continue;
      }
      const { value, done: streamDone } = await reader.read();
      if (value) {
        const chunk = decoder.decode(value);
        for (let c of chunk) {
          text += c;
          story.set(text);
          await new Promise(r => setTimeout(r, $typingSpeed));
          if ($paused) break;
        }
      }
      done = streamDone;
    }
    aiDrafting.set(false);
  } catch (err) {
    if (typeof err === 'object' && err && 'name' in err && err.name !== 'AbortError') {
      alert('AI drafting failed.');
    }
    aiDrafting.set(false);
  }
}

function toggleDrafting() {
  if ($aiDrafting) {
    paused.set(true);
    aiDrafting.set(false);
    if (abortController) abortController.abort();
  } else {
    paused.set(false);
    startAIDrafting();
  }
}


function pause() {
  paused.set(true);
}

function edit() {
  userEditing.set(true);
  pause();
  editedStory = $story;
}

function saveEdit(newContent: string) {
  editedStory = newContent;
  story.set(newContent);
  userEditing.set(false);
}
</script>


<style>
.writing-container {
  max-width: 700px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 2rem;
}
.story-area {
  background: #f9f9f9;
  border-radius: 6px;
  min-height: 200px;
  padding: 1rem;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}
.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
button {
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  border: none;
  background: #0057b8;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
button[disabled] {
  background: #ccc;
  cursor: not-allowed;
}
input, textarea {
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}
</style>

<div class="writing-container">
  <div class="top-link-bar" style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
    <a href="/dlltw/context-templates" class="context-link">📄 Context Templates</a>
  </div>
  <h1>AI Writing Companion (DLLTW)</h1>
  <div class="story-section">
    <label for="story">Story:</label>
    <div class="story-output" id="story" contenteditable={!$aiDrafting} spellcheck="false"
      style="width:100%; min-height:8em; font-size:1.1rem; background:#f9f9f9; border-radius:6px; border:1px solid #ccc; padding:1rem; margin-bottom:1.5rem; white-space:pre-wrap; outline:none;"
      on:input={e => story.set(e.target && 'innerText' in e.target ? e.target.innerText : $story)}>{$story}</div>
  </div>
  <div class="direction-section">
    <label for="direction">Story Direction / Instructions:</label>
    <textarea id="direction" bind:value={$direction} placeholder="e.g. Introduce a plot twist, focus on dialogue, change the setting..." rows="3" style="width:100%; margin-bottom:1.5rem;"></textarea>
  </div>
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1.5em; margin: 1rem 0 2rem 0;">
    <label for="typingSpeed" style="white-space:nowrap;">Typing Speed:</label>
    <input id="typingSpeed" type="range" min="150" max="10" step="5" bind:value={$typingSpeed} style="width: 180px; margin: 0 0.5em; vertical-align: middle; direction: rtl;" />
    <span style="min-width:60px;">{$typingSpeed} ms/char</span>
    <label style="display:flex;align-items:center;gap:0.5em; white-space:nowrap;">
      <input type="checkbox" bind:checked={$oneParagraph} style="margin-left:1em;" />
      <span style="font-size:0.98em;">Only generate one paragraph</span>
    </label>
  </div>
  <div class="controls">
    <button on:click={toggleDrafting} disabled={false} style="min-width:120px;">
      {#if $aiDrafting}Pause{:else}Start{/if}
    </button>
  </div>
</div>
