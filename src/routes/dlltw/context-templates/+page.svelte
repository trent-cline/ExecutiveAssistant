<script lang="ts">
import { goto } from '$app/navigation';

interface Template {
  name: string;
  description: string;
  storyStart: string;
  directions: string;
}

const templates: Template[] = [
  {
    name: 'Sales Email',
    description: 'Generate a persuasive sales email to a potential client.',
    storyStart: `Hi Jane,\n\nI hope this message finds you well. I’m excited to introduce our new software solution that could streamline your team’s workflow and boost productivity.`,
    directions: `Continue this email in a conversational, persuasive tone. Focus on how the product solves common pain points for software teams. Highlight unique features and include a clear call to action inviting the recipient to schedule a demo or reply with questions.`
  },
  {
    name: 'LinkedIn Post',
    description: 'Draft a professional LinkedIn post for networking or sharing insights.',
    storyStart: `Excited to announce that I’ve joined Acme Corp as Head of Product!\n\nLooking forward to connecting with talented professionals and sharing insights about the future of tech.`,
    directions: `Continue this post in a positive, professional tone. Encourage engagement by inviting comments and connections. Mention a specific project or goal you’re excited about in your new role.`
  },
  {
    name: 'Email Response',
    description: 'Generate a polite and effective response to a received email.',
    storyStart: `Thank you for reaching out with your question about our product pricing.\n\nI appreciate your interest and am happy to provide more details.`,
    directions: `Continue this response in a courteous, informative tone. Clearly outline the pricing structure and offer to answer any additional questions. End with a friendly closing and an invitation to connect further.`
  },
  {
    name: 'Long Form Research',
    description: 'Create a detailed, research-based article or report.',
    storyStart: `Artificial intelligence (AI) is rapidly transforming the healthcare industry.\n\nFrom diagnostics to patient care, AI-powered solutions are driving innovation and improving outcomes.`,
    directions: `Continue this article in a formal, informative style. Provide specific examples and cite recent studies. Organize content with clear headings. Conclude with a summary of key findings and future outlook.`
  }
];

function useTemplate(template: Template) {
  goto(`/dlltw/writing-companion?prompt=${encodeURIComponent(template.storyStart)}&direction=${encodeURIComponent(template.directions)}`);
}
</script>

<style>
.context-templates-container {
  max-width: 700px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 2rem;
}
.templates-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.template-card {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 1.2rem 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.template-card h2 {
  margin: 0 0 0.2rem 0;
  font-size: 1.15rem;
}
.template-card p {
  margin: 0 0 0.3rem 0;
  color: #444;
}
.template-card button {
  align-self: flex-start;
  background: #0057b8;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 0.4rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.template-card button:hover {
  background: #003f7d;
}
</style>

<div class="context-templates-container">
  <h1>Context Templates</h1>
  <div class="templates-list">
    {#each templates as template}
      <div class="template-card">
        <h2>{template.name}</h2>
        <p>{template.description}</p>
        <div style="margin:0.7em 0 0.3em 0;">
          <strong>Story Start:</strong>
          <pre style="background:#f5f5f5;padding:0.7em 1em;margin:0.3em 0 0.5em 0;border-radius:5px;white-space:pre-wrap;font-size:0.97em;">{template.storyStart}</pre>
        </div>
        <div style="margin-bottom:0.7em;">
          <strong>Directions:</strong>
          <div style="background:#f5f5f5;padding:0.7em 1em;border-radius:5px;white-space:pre-wrap;font-size:0.97em;">{template.directions}</div>
        </div>
        <button on:click={() => useTemplate(template)}>Use Template</button>
      </div>
    {/each}
  </div>
</div>
