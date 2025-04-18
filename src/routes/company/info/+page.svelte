<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    
    let companyInfo: {
        id?: string;
        name: string;
        description: string;
        mission: string;
        vision: string;
        values: string[];
        tech_stack: string[];
        code_context: string;
        business_context: string;
    } = {
        name: '',
        description: '',
        mission: '',
        vision: '',
        values: [],
        tech_stack: [],
        code_context: '',
        business_context: ''
    };
    
    let isEditing = false;
    let error: string | null = null;
    let success: string | null = null;
    
    onMount(async () => {
        await fetchCompanyInfo();
    });
    
    async function fetchCompanyInfo() {
        try {
            const { data, error: fetchError } = await supabase
                .from('company_info')
                .select('*')
                .single();
                
            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }
            
            if (data) {
                companyInfo = {
                    ...companyInfo,
                    ...data
                };
            }
        } catch (err: any) {
            console.error('Error fetching company info:', err);
            error = err.message;
        }
    }
    
    async function saveCompanyInfo() {
        try {
            error = null;
            success = null;
            
            const { data, error: upsertError } = await supabase
                .from('company_info')
                .upsert({
                    id: companyInfo.id || undefined,
                    name: companyInfo.name,
                    description: companyInfo.description,
                    mission: companyInfo.mission,
                    vision: companyInfo.vision,
                    values: companyInfo.values,
                    tech_stack: companyInfo.tech_stack,
                    code_context: companyInfo.code_context,
                    business_context: companyInfo.business_context,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
                
            if (upsertError) throw upsertError;
            
            if (data) {
                companyInfo = {
                    ...companyInfo,
                    ...data
                };
            }
            
            isEditing = false;
            success = 'Company information saved successfully!';
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                success = null;
            }, 3000);
        } catch (err: any) {
            console.error('Error saving company info:', err);
            error = err.message;
        }
    }
    
    function addItem(field: 'values' | 'tech_stack') {
        if (field === 'values') {
            companyInfo.values = [...companyInfo.values, ''];
        } else if (field === 'tech_stack') {
            companyInfo.tech_stack = [...companyInfo.tech_stack, ''];
        }
    }
    
    function removeItem(field: 'values' | 'tech_stack', index: number) {
        if (field === 'values') {
            companyInfo.values = companyInfo.values.filter((_, i) => i !== index);
        } else if (field === 'tech_stack') {
            companyInfo.tech_stack = companyInfo.tech_stack.filter((_, i) => i !== index);
        }
    }
</script>

<div class="company-info-page">
    <div class="page-header">
        <h1>Company Information</h1>
        <div class="header-actions">
            {#if isEditing}
                <button class="cancel-button" on:click={() => isEditing = false}>
                    Cancel
                </button>
                <button class="save-button" on:click={saveCompanyInfo}>
                    Save Changes
                </button>
            {:else}
                <button class="edit-button" on:click={() => isEditing = true}>
                    Edit Information
                </button>
            {/if}
        </div>
    </div>
    
    {#if error}
        <div class="error-message" role="alert">
            <p>{error}</p>
            <button class="close-button" on:click={() => error = null} aria-label="Dismiss error">×</button>
        </div>
    {/if}
    
    {#if success}
        <div class="success-message" role="alert">
            <p>{success}</p>
            <button class="close-button" on:click={() => success = null} aria-label="Dismiss message">×</button>
        </div>
    {/if}
    
    <div class="info-container">
        <div class="info-section">
            <h2>Basic Information</h2>
            <div class="info-field">
                <label for="company-name">Company Name</label>
                {#if isEditing}
                    <input 
                        id="company-name" 
                        type="text" 
                        bind:value={companyInfo.name} 
                        placeholder="Enter company name"
                    />
                {:else}
                    <p>{companyInfo.name || 'Not specified'}</p>
                {/if}
            </div>
            
            <div class="info-field">
                <label for="company-description">Description</label>
                {#if isEditing}
                    <textarea 
                        id="company-description" 
                        bind:value={companyInfo.description} 
                        placeholder="Enter company description"
                        rows="4"
                    ></textarea>
                {:else}
                    <p>{companyInfo.description || 'Not specified'}</p>
                {/if}
            </div>
        </div>
        
        <div class="info-section">
            <h2>Mission, Vision & Values</h2>
            <div class="info-field">
                <label for="company-mission">Mission</label>
                {#if isEditing}
                    <textarea 
                        id="company-mission" 
                        bind:value={companyInfo.mission} 
                        placeholder="Enter company mission"
                        rows="3"
                    ></textarea>
                {:else}
                    <p>{companyInfo.mission || 'Not specified'}</p>
                {/if}
            </div>
            
            <div class="info-field">
                <label for="company-vision">Vision</label>
                {#if isEditing}
                    <textarea 
                        id="company-vision" 
                        bind:value={companyInfo.vision} 
                        placeholder="Enter company vision"
                        rows="3"
                    ></textarea>
                {:else}
                    <p>{companyInfo.vision || 'Not specified'}</p>
                {/if}
            </div>
            
            <div class="info-field">
                <label id="values-label">Values</label>
                {#if isEditing}
                    <div class="list-editor" aria-labelledby="values-label">
                        {#each companyInfo.values as value, index}
                            <div class="list-item-editor">
                                <input 
                                    type="text" 
                                    bind:value={companyInfo.values[index]} 
                                    placeholder="Enter value"
                                />
                                <button class="remove-button" on:click={() => removeItem('values', index)}>
                                    ×
                                </button>
                            </div>
                        {/each}
                        <button class="add-button" on:click={() => addItem('values')}>
                            + Add Value
                        </button>
                    </div>
                {:else}
                    <ul class="value-list">
                        {#each companyInfo.values as value}
                            <li>{value}</li>
                        {:else}
                            <li class="empty-item">No values specified</li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
        
        <div class="info-section">
            <h2>Technical Information</h2>
            <div class="info-field">
                <label id="tech-stack-label">Tech Stack</label>
                {#if isEditing}
                    <div class="list-editor" aria-labelledby="tech-stack-label">
                        {#each companyInfo.tech_stack as stack, i}
                            <div class="array-item">
                                <input id={`tech-stack-${i}`} type="text" bind:value={companyInfo.tech_stack[i]} placeholder="Add tech" />
                                <button type="button" class="remove-btn" on:click={() => removeItem('tech_stack', i)} aria-label="Remove">&times;</button>
                            </div>
                        {/each}
                        <button type="button" class="add-btn" on:click={() => addItem('tech_stack')}>+ Add Tech</button>
                    </div>
                {:else}
                    <ul class="tech-list">
                        {#each companyInfo.tech_stack as tech}
                            <li>{tech}</li>
                        {:else}
                            <li class="empty-item">No technologies specified</li>
                        {/each}
                    </ul>
                {/if}
            </div>
            
            <div class="info-field">
                <label for="code-context">Code Context</label>
                {#if isEditing}
                    <textarea id="code-context" rows="3" bind:value={companyInfo.code_context} placeholder="Describe code context"></textarea>
                {:else}
                    <div class="code-context">{companyInfo.code_context}</div>
                {/if}
            </div>
        </div>
        
        <div class="info-section">
            <h2>Business Context</h2>
            <div class="info-field">
                <label for="business-context">Business Context</label>
                {#if isEditing}
                    <textarea id="business-context" rows="3" bind:value={companyInfo.business_context} placeholder="Describe business context"></textarea>
                {:else}
                    <div class="business-context">
                        {#if companyInfo.business_context && companyInfo.business_context.trim() !== ''}
                            {#each companyInfo.business_context.split('\n') as line}
                                <p>{line}</p>
                            {/each}
                        {:else}
                            <p>Not specified</p>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .company-info-page {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .page-header h1 {
        font-size: 1.875rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
    }
    
    .header-actions {
        display: flex;
        gap: 0.75rem;
    }
    
    .edit-button, .save-button, .cancel-button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .edit-button {
        background-color: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    
    .edit-button:hover {
        background-color: #e5e7eb;
    }
    
    .save-button {
        background-color: #3b82f6;
        color: white;
        border: none;
    }
    
    .save-button:hover {
        background-color: #2563eb;
    }
    
    .cancel-button {
        background-color: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    
    .cancel-button:hover {
        background-color: #e5e7eb;
    }
    
    .error-message, .success-message {
        padding: 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .error-message {
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        color: #b91c1c;
    }
    
    .success-message {
        background-color: #d1fae5;
        border: 1px solid #a7f3d0;
        color: #047857;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: inherit;
        padding: 0;
        margin-left: 0.5rem;
    }
    
    .info-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    
    .info-section {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
    }
    
    .info-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin-top: 0;
        margin-bottom: 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .info-field {
        margin-bottom: 1.5rem;
    }
    
    .info-field:last-child {
        margin-bottom: 0;
    }
    
    .info-field label {
        display: block;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
    }
    
    .info-field p {
        margin: 0;
        color: #4b5563;
        line-height: 1.5;
    }
    
    .info-field input, .info-field textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        color: #111827;
    }
    
    .info-field input:focus, .info-field textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }
    
    .list-editor {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .list-item-editor {
        display: flex;
        gap: 0.5rem;
    }
    
    .remove-button {
        background-color: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        width: 2rem;
        height: 2.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        cursor: pointer;
        color: #6b7280;
    }
    
    .remove-button:hover {
        background-color: #fee2e2;
        color: #b91c1c;
    }
    
    .add-button {
        background: none;
        border: 1px dashed #d1d5db;
        border-radius: 0.375rem;
        padding: 0.5rem;
        color: #6b7280;
        font-size: 0.875rem;
        cursor: pointer;
        margin-top: 0.5rem;
        transition: all 0.2s;
    }
    
    .add-button:hover {
        background-color: #f9fafb;
        border-color: #9ca3af;
        color: #4b5563;
    }
    
    .value-list, .tech-list {
        list-style-type: disc;
        margin: 0;
        padding-left: 1.5rem;
        color: #4b5563;
    }
    
    .value-list li, .tech-list li {
        margin-bottom: 0.25rem;
    }
    
    .empty-item {
        color: #9ca3af;
        font-style: italic;
        list-style-type: none;
        margin-left: -1.5rem;
    }
    
    .code-context {
        background-color: #f9fafb;
        border-radius: 0.375rem;
        padding: 1rem;
        white-space: pre-wrap;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.875rem;
        color: #4b5563;
        line-height: 1.5;
        overflow-x: auto;
    }
    
    .business-context p {
        margin-bottom: 0.75rem;
    }
    
    @media (max-width: 640px) {
        .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .header-actions {
            width: 100%;
        }
        
        .edit-button, .save-button, .cancel-button {
            flex: 1;
            text-align: center;
        }
    }
</style>
