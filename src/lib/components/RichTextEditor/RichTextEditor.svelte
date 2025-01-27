# svelte-file
<script lang="ts">
    import { onMount } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Highlight from '@tiptap/extension-highlight';
    import TaskList from '@tiptap/extension-task-list';
    import TaskItem from '@tiptap/extension-task-item';
    import Link from '@tiptap/extension-link';
    import Image from '@tiptap/extension-image';
    import Placeholder from '@tiptap/extension-placeholder';

    export let content = '';
    export let placeholder = 'Start writing...';
    export let onUpdate: (content: string) => void = () => {};
    
    let editor: Editor;
    let editorElement: HTMLElement;
    let showLinkInput = false;
    let linkUrl = '';
    let linkSelection = null;

    onMount(() => {
        if (!editorElement) return;

        editor = new Editor({
            element: editorElement,
            extensions: [
                StarterKit,
                Highlight,
                TaskList,
                TaskItem.configure({
                    nested: true
                }),
                Link.configure({
                    openOnClick: true,
                    linkOnPaste: true
                }),
                Image,
                Placeholder.configure({
                    placeholder
                })
            ],
            content,
            editable: true,
            autofocus: true,
            onUpdate: ({ editor }) => {
                const html = editor.getHTML();
                onUpdate(html);
            }
        });

        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    });

    function toggleFormat(format: string) {
        if (!editor) return;
        
        switch (format) {
            case 'bold':
                editor.chain().focus().toggleBold().run();
                break;
            case 'italic':
                editor.chain().focus().toggleItalic().run();
                break;
            case 'strike':
                editor.chain().focus().toggleStrike().run();
                break;
            case 'code':
                editor.chain().focus().toggleCode().run();
                break;
            case 'highlight':
                editor.chain().focus().toggleHighlight().run();
                break;
        }
    }

    function setHeading(level: number) {
        if (!editor) return;
        editor.chain().focus().toggleHeading({ level }).run();
    }

    function toggleList(type: 'bullet' | 'ordered' | 'task') {
        if (!editor) return;
        
        switch (type) {
            case 'bullet':
                editor.chain().focus().toggleBulletList().run();
                break;
            case 'ordered':
                editor.chain().focus().toggleOrderedList().run();
                break;
            case 'task':
                editor.chain().focus().toggleTaskList().run();
                break;
        }
    }

    function addLink() {
        if (!editor || !linkUrl) return;
        
        if (linkSelection) {
            editor.chain()
                .focus()
                .setLink({ href: linkUrl })
                .run();
        }
        
        showLinkInput = false;
        linkUrl = '';
        linkSelection = null;
    }

    function handleLinkClick() {
        if (!editor) return;
        
        const selection = editor.state.selection;
        if (selection.empty) return;
        
        showLinkInput = true;
        linkSelection = selection;
    }

    function addImage() {
        const url = window.prompt('Enter image URL:');
        if (url && editor) {
            editor.chain()
                .focus()
                .setImage({ src: url })
                .run();
        }
    }
</script>

<div class="rich-text-editor">
    <div class="toolbar">
        <div class="toolbar-group">
            <button 
                class="toolbar-button" 
                on:click={() => setHeading(1)} 
                title="Heading 1"
            >
                <span class="material-icons">title</span>1
            </button>
            <button 
                class="toolbar-button" 
                on:click={() => setHeading(2)} 
                title="Heading 2"
            >
                <span class="material-icons">title</span>2
            </button>
        </div>

        <div class="toolbar-group">
            <button 
                class="toolbar-button" 
                on:click={() => toggleFormat('bold')} 
                title="Bold"
            >
                <span class="material-icons">format_bold</span>
            </button>
            <button 
                class="toolbar-button" 
                on:click={() => toggleFormat('italic')} 
                title="Italic"
            >
                <span class="material-icons">format_italic</span>
            </button>
            <button 
                class="toolbar-button" 
                on:click={() => toggleFormat('strike')} 
                title="Strikethrough"
            >
                <span class="material-icons">format_strikethrough</span>
            </button>
            <button 
                class="toolbar-button" 
                on:click={() => toggleFormat('highlight')} 
                title="Highlight"
            >
                <span class="material-icons">highlight</span>
            </button>
        </div>

        <div class="toolbar-group">
            <button 
                class="toolbar-button" 
                on:click={() => toggleList('bullet')} 
                title="Bullet List"
            >
                <span class="material-icons">format_list_bulleted</span>
            </button>
            <button 
                class="toolbar-button" 
                on:click={() => toggleList('ordered')} 
                title="Numbered List"
            >
                <span class="material-icons">format_list_numbered</span>
            </button>
            <button 
                class="toolbar-button" 
                on:click={() => toggleList('task')} 
                title="Task List"
            >
                <span class="material-icons">checklist</span>
            </button>
        </div>

        <div class="toolbar-group">
            <button 
                class="toolbar-button" 
                on:click={handleLinkClick} 
                title="Add Link"
            >
                <span class="material-icons">link</span>
            </button>
            <button 
                class="toolbar-button" 
                on:click={addImage} 
                title="Add Image"
            >
                <span class="material-icons">image</span>
            </button>
        </div>
    </div>

    {#if showLinkInput}
        <div class="link-input">
            <input 
                type="url" 
                bind:value={linkUrl} 
                placeholder="Enter URL..."
                on:keydown={(e) => e.key === 'Enter' && addLink()}
            >
            <button on:click={addLink}>Add</button>
            <button on:click={() => showLinkInput = false}>Cancel</button>
        </div>
    {/if}

    <div 
        class="editor-content" 
        bind:this={editorElement}
    ></div>
</div>

<style>
    .rich-text-editor {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        overflow: hidden;
    }

    .toolbar {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
        flex-wrap: wrap;
    }

    .toolbar-group {
        display: flex;
        gap: 0.25rem;
        padding: 0 0.5rem;
        border-right: 1px solid #e2e8f0;
    }

    .toolbar-group:last-child {
        border-right: none;
    }

    .toolbar-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: #4a5568;
        cursor: pointer;
        transition: all 0.2s;
    }

    .toolbar-button:hover {
        background: #edf2f7;
        color: #2d3748;
    }

    .toolbar-button.active {
        background: #e2e8f0;
        color: #2d3748;
    }

    .editor-content {
        padding: 1rem;
        min-height: 300px;
        max-height: 600px;
        overflow-y: auto;
        cursor: text;
        position: relative;
    }

    .editor-content :global(.ProseMirror) {
        outline: none;
        min-height: 100%;
    }

    .editor-content :global(.ProseMirror p.is-editor-empty:first-child::before) {
        content: attr(data-placeholder);
        float: left;
        color: #adb5bd;
        pointer-events: none;
        height: 0;
    }

    .editor-content :global(p) {
        margin: 0.5em 0;
    }

    .editor-content :global(h1) {
        font-size: 1.5em;
        margin: 1em 0 0.5em;
    }

    .editor-content :global(h2) {
        font-size: 1.25em;
        margin: 1em 0 0.5em;
    }

    .editor-content :global(ul),
    .editor-content :global(ol) {
        padding-left: 1.5em;
        margin: 0.5em 0;
    }

    .editor-content :global(.task-list) {
        list-style: none;
        padding-left: 0;
    }

    .editor-content :global(.task-list-item) {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    .link-input {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
    }

    .link-input input {
        flex: 1;
        padding: 0.25rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
    }

    .link-input button {
        padding: 0.25rem 0.75rem;
        border: none;
        border-radius: 4px;
        background: #4a5568;
        color: white;
        cursor: pointer;
        transition: background 0.2s;
    }

    .link-input button:hover {
        background: #2d3748;
    }

    .link-input button:last-child {
        background: #e2e8f0;
        color: #4a5568;
    }

    .link-input button:last-child:hover {
        background: #cbd5e0;
    }

    @media (max-width: 768px) {
        .toolbar {
            gap: 0.25rem;
            padding: 0.25rem;
        }

        .toolbar-group {
            padding: 0 0.25rem;
        }

        .toolbar-button {
            width: 1.75rem;
            height: 1.75rem;
        }
    }
</style>
