<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import AuthGuard from '$lib/components/AuthGuard.svelte';
    import { fade, fly } from 'svelte/transition';
    
    // Types
    interface Document {
        id: string;
        title: string;
        content: string;
        tags: string[];
        created_at: string;
        type: 'text' | 'url' | 'file';
        metadata?: Record<string, any>;
    }
    
    interface KnowledgeBase {
        id: string;
        name: string;
        description: string;
        document_ids: string[];
        created_at: string;
        updated_at: string;
    }
    
    interface ChatMessage {
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: string;
    }

    // State
    let documents: Document[] = [];
    let knowledgebases: KnowledgeBase[] = [];
    let activeTab = 'documents';
    let documentTitle = '';
    let documentContent = '';
    let documentTags = '';
    let documentType: 'text' | 'url' | 'file' = 'text';
    let documentUrl = '';
    let documentFile: File | null = null;
    let kbName = '';
    let kbDescription = '';
    let selectedDocumentIds: string[] = [];
    let loadingDocuments = true;
    let loadingKbs = true;
    let processingDocument = false;
    let processingKb = false;
    let chatError = '';
    let chatMessages: ChatMessage[] = [];
    let userMessage = '';
    let showInstructionsModal = false;
    let processingChat = false;
    let activeKnowledgeBaseId = '';
    let errorMessage = '';
    let successMessage = '';
    let fileContent = '';

    onMount(async () => {
        await loadDocuments();
        await loadKnowledgeBases();
        addSystemMessage();
    });

    function addSystemMessage() {
        chatMessages = [
            {
                role: 'system',
                content: 'I am your knowledge assistant. Ask me questions about your documents and knowledge bases.',
                timestamp: new Date().toISOString()
            }
        ];
    }

    async function loadDocuments() {
        try {
            loadingDocuments = true;
            const { data, error } = await supabase
                .from('rag_documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            documents = data || [];
        } catch (e) {
            console.error('Error loading documents:', e);
            errorMessage = e instanceof Error ? e.message : 'Failed to load documents';
            setTimeout(() => { errorMessage = ''; }, 5000);
        } finally {
            loadingDocuments = false;
        }
    }

    async function loadKnowledgeBases() {
        try {
            loadingKbs = true;
            const { data, error } = await supabase
                .from('rag_knowledge_bases')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            knowledgebases = data || [];
            
            // Set default knowledge base if available
            if (knowledgebases.length > 0 && !activeKnowledgeBaseId) {
                activeKnowledgeBaseId = knowledgebases[0].id;
            }
        } catch (e) {
            console.error('Error loading knowledge bases:', e);
            errorMessage = e instanceof Error ? e.message : 'Failed to load knowledge bases';
            setTimeout(() => { errorMessage = ''; }, 5000);
        } finally {
            loadingKbs = false;
        }
    }

    async function handleFileInput(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            documentFile = input.files[0];
            
            // Simple text file preview
            if (documentFile.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        fileContent = e.target.result as string;
                    }
                };
                reader.readAsText(documentFile);
            } else {
                fileContent = `File selected: ${documentFile.name} (${formatFileSize(documentFile.size)})`;
            }
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    async function createDocument() {
        try {
            processingDocument = true;
            errorMessage = '';
            
            if (!documentTitle.trim()) {
                throw new Error('Document title is required');
            }
            
            let content = '';
            let metadata = {};
            
            // Process based on document type
            if (documentType === 'text') {
                if (!documentContent.trim()) {
                    throw new Error('Document content is required');
                }
                content = documentContent;
            } else if (documentType === 'url') {
                if (!documentUrl.trim()) {
                    throw new Error('URL is required');
                }
                content = documentUrl;
                metadata = { source_url: documentUrl };
                // In a real app, you would fetch and process the URL content here
            } else if (documentType === 'file') {
                if (!documentFile) {
                    throw new Error('File is required');
                }
                
                if (documentFile.type === 'text/plain') {
                    content = fileContent;
                } else {
                    // In a real app, you would process different file types
                    content = `File content for ${documentFile.name}`;
                }
                
                metadata = {
                    filename: documentFile.name,
                    filesize: documentFile.size,
                    filetype: documentFile.type
                };
            }
            
            const tags = documentTags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);
            
            const newDocument = {
                title: documentTitle,
                content,
                tags,
                type: documentType,
                metadata,
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('rag_documents')
                .insert(newDocument)
                .select();
                
            if (error) throw error;
            
            // Reset form
            documentTitle = '';
            documentContent = '';
            documentTags = '';
            documentUrl = '';
            documentFile = null;
            fileContent = '';
            
            // Reload documents
            await loadDocuments();
            
            successMessage = 'Document created successfully!';
            setTimeout(() => { successMessage = ''; }, 5000);
        } catch (e) {
            console.error('Error creating document:', e);
            errorMessage = e instanceof Error ? e.message : 'Failed to create document';
            setTimeout(() => { errorMessage = ''; }, 5000);
        } finally {
            processingDocument = false;
        }
    }

    async function createKnowledgeBase() {
        try {
            processingKb = true;
            errorMessage = '';
            
            if (!kbName.trim()) {
                throw new Error('Knowledge base name is required');
            }
            
            if (selectedDocumentIds.length === 0) {
                throw new Error('Select at least one document');
            }
            
            const newKb = {
                name: kbName,
                description: kbDescription,
                document_ids: selectedDocumentIds,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('rag_knowledge_bases')
                .insert(newKb)
                .select();
                
            if (error) throw error;
            
            // Reset form
            kbName = '';
            kbDescription = '';
            selectedDocumentIds = [];
            
            // Reload knowledge bases
            await loadKnowledgeBases();
            
            successMessage = 'Knowledge base created successfully!';
            setTimeout(() => { successMessage = ''; }, 5000);
        } catch (e) {
            console.error('Error creating knowledge base:', e);
            errorMessage = e instanceof Error ? e.message : 'Failed to create knowledge base';
            setTimeout(() => { errorMessage = ''; }, 5000);
        } finally {
            processingKb = false;
        }
    }

    async function sendMessage() {
        if (!userMessage.trim() || processingChat) return;
        
        const message = userMessage.trim();
        userMessage = '';
        
        // Add user message to chat
        chatMessages = [
            ...chatMessages,
            {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            }
        ];
        
        processingChat = true;
        
        try {
            // Find active knowledge base
            const activeKb = knowledgebases.find(kb => kb.id === activeKnowledgeBaseId);
            
            if (!activeKb) {
                throw new Error('No knowledge base selected');
            }
            
            // Get documents for the knowledge base
            const kbDocuments = documents.filter(doc => 
                activeKb.document_ids.includes(doc.id)
            );
            
            // In a real app, you would send the message to an API that
            // would use the knowledge base documents to generate a response
            // For now, we'll simulate a response
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate a basic response mentioning the knowledge base and documents
            const response = simulateAssistantResponse(message, activeKb, kbDocuments);
            
            // Add assistant response to chat
            chatMessages = [
                ...chatMessages,
                {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date().toISOString()
                }
            ];
        } catch (e) {
            console.error('Error processing chat:', e);
            
            // Add error message to chat
            chatMessages = [
                ...chatMessages,
                {
                    role: 'assistant',
                    content: `Error: ${e instanceof Error ? e.message : 'Failed to process your message'}`,
                    timestamp: new Date().toISOString()
                }
            ];
        } finally {
            processingChat = false;
        }
    }

    function simulateAssistantResponse(message: string, kb: KnowledgeBase, docs: Document[]): string {
        // In a real app, this would use a language model with the document content
        // For demo purposes, we'll generate a simple response
        
        const lowercaseMsg = message.toLowerCase();
        let response = '';
        
        const hasDocuments = docs.length > 0;
        
        if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi')) {
            response = `Hello! I'm your knowledge assistant for the "${kb.name}" knowledge base. `;
            response += hasDocuments ? 
                `This knowledge base contains ${docs.length} documents that I can help you with. What would you like to know?` :
                `This knowledge base is empty. Try adding some documents first.`;
        }
        else if (lowercaseMsg.includes('document') || lowercaseMsg.includes('documents')) {
            if (hasDocuments) {
                response = `The "${kb.name}" knowledge base contains ${docs.length} documents:\n\n`;
                response += docs.map(doc => `- ${doc.title}`).join('\n');
                response += '\n\nWhat would you like to know about these documents?';
            } else {
                response = `The "${kb.name}" knowledge base doesn't have any documents yet. Try adding some first.`;
            }
        } 
        else if (hasDocuments) {
            // Check if the query matches any document content
            const relevantDocuments = docs.filter(doc => 
                doc.content.toLowerCase().includes(lowercaseMsg) || 
                doc.title.toLowerCase().includes(lowercaseMsg)
            );
            
            if (relevantDocuments.length > 0) {
                const doc = relevantDocuments[0]; // Use the first relevant document
                response = `Based on the document "${doc.title}", I found this information:\n\n`;
                
                // Extract a snippet from the document content
                const content = doc.content;
                const maxSnippetLength = 200;
                
                if (content.length <= maxSnippetLength) {
                    response += content;
                } else {
                    // Find a position where the query appears
                    const queryPos = content.toLowerCase().indexOf(lowercaseMsg);
                    
                    if (queryPos >= 0) {
                        const start = Math.max(0, queryPos - 50);
                        const end = Math.min(content.length, queryPos + message.length + 150);
                        response += `...${content.substring(start, end)}...`;
                    } else {
                        // Just take the beginning if query not found
                        response += `${content.substring(0, maxSnippetLength)}...`;
                    }
                }
                
                response += '\n\nIs there anything specific you would like to know about this?';
            } else {
                response = `I don't have enough information about "${message}" in my knowledge base. Can you try rephrasing your question or asking about something else?`;
            }
        } else {
            response = `I'd like to help, but the "${kb.name}" knowledge base doesn't have any documents yet. Try adding some first.`;
        }
        
        return response;
    }

    function toggleDocumentSelection(id: string) {
        if (selectedDocumentIds.includes(id)) {
            selectedDocumentIds = selectedDocumentIds.filter(docId => docId !== id);
        } else {
            selectedDocumentIds = [...selectedDocumentIds, id];
        }
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
</script>

<AuthGuard>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">RAG Creator</h1>
                <p class="text-gray-600">Create and manage your Retrieval-Augmented Generation system</p>
            </div>
            <button
                class="bg-blue-100 text-blue-800 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors flex items-center"
                on:click={() => showInstructionsModal = true}
            >
                <i class="fas fa-question-circle mr-2"></i>
                Instructions
            </button>
        </div>
        
        <!-- Instructions Modal -->
        {#if showInstructionsModal}
            <!-- Using a button instead of div for better accessibility -->
            <div class="modal-backdrop" on:click={() => showInstructionsModal = false} transition:fade={{duration: 200}}>
                <div 
                    class="modal-content"
                    on:click|stopPropagation
                    on:keydown|stopPropagation
                    role="dialog"
                >
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-xl font-semibold">How to Use the RAG System</h2>
                        <button class="text-gray-500 hover:text-gray-700" on:click={() => showInstructionsModal = false}>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body overflow-y-auto max-h-[70vh]">
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold mb-2 text-blue-700">Getting Started</h3>
                            <ol class="list-decimal list-inside space-y-2 pl-2">
                                <li>First, add documents by selecting the <strong>Documents</strong> tab</li>
                                <li>Choose the document type (text, URL, or file) and enter its content</li>
                                <li>Add relevant tags to help organize your knowledge</li>
                                <li>Create a knowledge base in the <strong>Knowledge Bases</strong> tab</li>
                                <li>Select documents to include in your knowledge base</li>
                                <li>Chat with the AI using the knowledge from your documents</li>
                            </ol>
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold mb-2 text-blue-700">Best Practices</h3>
                            <ul class="list-disc list-inside space-y-2 pl-2">
                                <li>Use descriptive titles for documents and knowledge bases</li>
                                <li>Break large documents into smaller, focused chunks for better retrieval</li>
                                <li>Create separate knowledge bases for different topics or projects</li>
                                <li>Use specific, focused questions when chatting with the AI</li>
                                <li>Add detailed tags to make documents more discoverable</li>
                                <li>Regularly update your knowledge bases with fresh information</li>
                                <li>Combine different document types for comprehensive knowledge</li>
                                <li>Review and refine your document collection periodically</li>
                            </ul>
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold mb-2 text-blue-700">Security Considerations</h3>
                            <ul class="list-disc list-inside space-y-2 pl-2">
                                <li><strong>Data Privacy:</strong> All documents are stored in your private Supabase database</li>
                                <li><strong>Access Control:</strong> Row-level security ensures only you can access your content</li>
                                <li><strong>Sensitive Information:</strong> Avoid uploading highly sensitive personal information</li>
                                <li><strong>Data Transmission:</strong> Embeddings are generated using encryption in transit</li>
                                <li><strong>Authentication:</strong> Your data is protected behind secure authentication</li>
                                <li><strong>Regular Backups:</strong> Consider regular exports of important knowledge bases</li>
                                <li><strong>Third-party Services:</strong> Embedding generation may use external API calls</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-semibold mb-2 text-blue-700">Limitations</h3>
                            <ul class="list-disc list-inside space-y-2 pl-2">
                                <li>The system works best with text-based content</li>
                                <li>Very large documents may need to be split for optimal performance</li>
                                <li>Responses are limited to information contained in your knowledge base</li>
                                <li>Complex queries might require rephrasing for better results</li>
                                <li>PDF and image-based documents have limited content extraction</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
        
        {#if errorMessage}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{errorMessage}</p>
            </div>
        {/if}
        
        {#if successMessage}
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <p>{successMessage}</p>
            </div>
        {/if}
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
                <!-- Tabs for Content Creation -->
                <div class="border-b mb-4">
                    <div class="flex flex-wrap -mb-px">
                        <button 
                            class="mr-2 inline-block py-2 px-4 border-b-2 {activeTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
                            on:click={() => activeTab = 'documents'}
                        >
                            Documents
                        </button>
                        <button 
                            class="mr-2 inline-block py-2 px-4 border-b-2 {activeTab === 'kb' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
                            on:click={() => activeTab = 'kb'}
                        >
                            Knowledge Bases
                        </button>
                    </div>
                </div>
                
                <!-- Documents Tab Content -->
                {#if activeTab === 'documents'}
                    <h2 class="text-xl font-semibold mb-4">Add New Document</h2>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2" for="documentType">Document Type</label>
                        <div class="flex space-x-4">
                            <label class="inline-flex items-center">
                                <input type="radio" class="form-radio" name="documentType" value="text" bind:group={documentType}>
                                <span class="ml-2">Text</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" class="form-radio" name="documentType" value="url" bind:group={documentType}>
                                <span class="ml-2">URL</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" class="form-radio" name="documentType" value="file" bind:group={documentType}>
                                <span class="ml-2">File</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2" for="documentTitle">Title</label>
                        <input 
                            type="text" 
                            id="documentTitle" 
                            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300" 
                            placeholder="Document title" 
                            bind:value={documentTitle}
                        />
                    </div>
                    
                    {#if documentType === 'text'}
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2" for="documentContent">Content</label>
                            <textarea 
                                id="document-content"
                                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300" 
                                rows="10" 
                                placeholder="Enter document content..." 
                                bind:value={documentContent}
                            ></textarea>
                        </div>
                    {:else if documentType === 'url'}
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2" for="documentUrl">URL</label>
                            <input 
                                type="url" 
                                id="documentUrl" 
                                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300" 
                                placeholder="https://example.com/document" 
                                bind:value={documentUrl}
                            />
                        </div>
                    {:else if documentType === 'file'}
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2" for="documentFile">File</label>
                            <input 
                                type="file" 
                                id="documentFile" 
                                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                                on:change={handleFileInput}
                                accept=".txt,.pdf,.docx,.doc,.md"
                            />
                            
                            {#if fileContent}
                                <div class="mt-2 p-3 bg-gray-50 rounded border">
                                    <p class="text-gray-700 text-sm">{fileContent.length > 200 ? fileContent.substring(0, 200) + '...' : fileContent}</p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2" for="documentTags">Tags (comma separated)</label>
                        <input 
                            type="text" 
                            id="documentTags" 
                            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300" 
                            placeholder="tag1, tag2, tag3" 
                            bind:value={documentTags}
                        />
                    </div>
                    
                    <button 
                        class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        on:click={createDocument}
                        disabled={processingDocument}
                    >
                        {processingDocument ? 'Processing...' : 'Add Document'}
                    </button>
                    
                    <hr class="my-6" />
                    
                    <h2 class="text-xl font-semibold mb-4">My Documents</h2>
                    
                    {#if loadingDocuments}
                        <div class="flex justify-center items-center p-4">
                            <div class="spinner"></div>
                            <span class="ml-3">Loading documents...</span>
                        </div>
                    {:else if documents.length === 0}
                        <p class="text-center text-gray-600 p-4">No documents found. Add your first document above.</p>
                    {:else}
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr>
                                        <th class="py-2 px-4 border-b text-left">Title</th>
                                        <th class="py-2 px-4 border-b text-left">Type</th>
                                        <th class="py-2 px-4 border-b text-left">Created</th>
                                        <th class="py-2 px-4 border-b text-left">Tags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each documents as document}
                                        <tr class="hover:bg-gray-50">
                                            <td class="py-2 px-4 border-b">{document.title}</td>
                                            <td class="py-2 px-4 border-b">{document.type}</td>
                                            <td class="py-2 px-4 border-b">{formatDate(document.created_at)}</td>
                                            <td class="py-2 px-4 border-b">
                                                <div class="flex flex-wrap gap-1">
                                                    {#each document.tags as tag}
                                                        <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{tag}</span>
                                                    {/each}
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                {:else if activeTab === 'kb'}
                    <h2 class="text-xl font-semibold mb-4">Create Knowledge Base</h2>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2" for="kbName">Knowledge Base Name</label>
                        <input 
                            type="text" 
                            id="kbName" 
                            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300" 
                            placeholder="My Knowledge Base" 
                            bind:value={kbName}
                        />
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2" for="kbDescription">Description</label>
                        <textarea 
                            id="kbDescription" 
                            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300" 
                            rows="3" 
                            placeholder="What is this knowledge base about?" 
                            bind:value={kbDescription}
                        ></textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">Select Documents</label>
                        {#if loadingDocuments}
                            <div class="flex justify-center items-center p-4">
                                <div class="spinner"></div>
                                <span class="ml-3">Loading documents...</span>
                            </div>
                        {:else if documents.length === 0}
                            <p class="text-center text-gray-600 p-4">No documents available. Please add documents first.</p>
                        {:else}
                            <div class="border rounded max-h-60 overflow-y-auto">
                                {#each documents as document}
                                    <div class="flex items-center p-2 hover:bg-gray-50 border-b">
                                        <input 
                                            type="checkbox" 
                                            id="doc-{document.id}" 
                                            class="mr-2"
                                            checked={selectedDocumentIds.includes(document.id)}
                                            on:change={() => toggleDocumentSelection(document.id)}
                                        />
                                        <label for="doc-{document.id}" class="flex-1 cursor-pointer">
                                            <div class="font-medium">{document.title}</div>
                                            <div class="text-xs text-gray-500">{document.type} • {formatDate(document.created_at)}</div>
                                        </label>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    
                    <button 
                        class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
                        on:click={createKnowledgeBase}
                        disabled={processingKb || !kbName || selectedDocumentIds.length === 0}
                    >
                        {processingKb ? 'Processing...' : 'Create Knowledge Base'}
                    </button>
                    
                    <hr class="my-6" />
                    
                    <h2 class="text-xl font-semibold mb-4">My Knowledge Bases</h2>
                    
                    {#if loadingKbs}
                        <div class="flex justify-center items-center p-4">
                            <div class="spinner"></div>
                            <span class="ml-3">Loading knowledge bases...</span>
                        </div>
                    {:else if knowledgebases.length === 0}
                        <p class="text-center text-gray-600 p-4">No knowledge bases found. Create your first knowledge base above.</p>
                    {:else}
                        <div class="space-y-3">
                            {#each knowledgebases as kb}
                                <div class="border rounded p-3 hover:shadow-md transition-shadow">
                                    <h3 class="font-semibold">{kb.name}</h3>
                                    <p class="text-sm text-gray-600 mt-1">{kb.description || 'No description'}</p>
                                    <div class="flex justify-between items-center mt-2">
                                        <span class="text-xs text-gray-500">
                                            {kb.document_ids?.length || 0} documents • Created {formatDate(kb.created_at)}
                                        </span>
                                        <button 
                                            class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                            on:click={() => activeKnowledgeBaseId = kb.id}
                                        >
                                            Use in Chat
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
            
            <!-- Chat Interface -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">Chat with Your Knowledge</h2>
                
                <div class="form-group">
                    <label for="kb-selector">Select Knowledge Base</label>
                    {#if loadingKbs}
                        <div class="flex items-center text-gray-600">
                            <div class="spinner mr-2"></div>
                            <span>Loading knowledge bases...</span>
                        </div>
                    {:else if knowledgebases.length === 0}
                        <div class="border rounded py-2 px-3 bg-gray-50 text-gray-500">
                            No knowledge bases available. Create one first.
                        </div>
                    {:else}
                        <select 
                            id="kb-selector"
                            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                            bind:value={activeKnowledgeBaseId}
                        >
                            {#each knowledgebases as kb}
                                <option value={kb.id}>{kb.name}</option>
                            {/each}
                        </select>
                    {/if}
                </div>
                
                <div class="border rounded-lg overflow-hidden flex flex-col h-96">
                    <div class="flex-1 p-4 overflow-y-auto">
                        {#if chatMessages.length === 0}
                            <div class="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <i class="fas fa-robot text-4xl mb-3"></i>
                                <p>Ask a question about your documents</p>
                            </div>
                        {:else}
                            <div class="space-y-4">
                                {#each chatMessages as message}
                                    <div class="chat-message {message.role}">
                                        {#if message.role === 'user'}
                                            <div class="message-bubble user">
                                                <div class="message-content">
                                                    {message.content}
                                                </div>
                                                <div class="message-timestamp">
                                                    {formatDate(message.timestamp)}
                                                </div>
                                            </div>
                                        {:else if message.role === 'assistant'}
                                            <div class="message-bubble assistant">
                                                <div class="message-content">
                                                    {#each message.content.split('\n') as line}
                                                        <p>{line}</p>
                                                    {/each}
                                                </div>
                                                <div class="message-timestamp">
                                                    {formatDate(message.timestamp)}
                                                </div>
                                            </div>
                                        {:else}
                                            <div class="message-bubble system">
                                                <div class="message-content">
                                                    {message.content}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                                
                                {#if processingChat}
                                    <div class="chat-message assistant">
                                        <div class="message-bubble assistant">
                                            <div class="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                    
                    <div class="border-t p-2">
                        <div class="flex">
                            <input 
                                type="text" 
                                class="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring focus:border-blue-300" 
                                placeholder="Type your message..." 
                                bind:value={userMessage}
                                on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                disabled={knowledgebases.length === 0 || processingChat}
                            />
                            <button 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg focus:outline-none focus:shadow-outline disabled:opacity-50"
                                on:click={sendMessage}
                                disabled={!userMessage.trim() || knowledgebases.length === 0 || processingChat}
                            >
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</AuthGuard>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 700px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-body {
        font-size: 0.95rem;
        line-height: 1.5;
        color: #374151;
    }
    
    .spinner {
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 3px solid #3b82f6;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .chat-message {
        display: flex;
        flex-direction: column;
    }
    
    .chat-message.user {
        align-items: flex-end;
    }
    
    .chat-message.assistant, .chat-message.system {
        align-items: flex-start;
    }
    
    .message-bubble {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .message-bubble.user {
        background-color: #1d4ed8;
        color: white;
        border-bottom-right-radius: 2px;
    }
    
    .message-bubble.assistant {
        background-color: #f3f4f6;
        color: #1f2937;
        border-bottom-left-radius: 2px;
    }
    
    .message-bubble.system {
        background-color: #fef3c7;
        color: #92400e;
        width: 100%;
        text-align: center;
        font-style: italic;
    }
    
    .message-timestamp {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 2px;
    }
    
    .message-bubble.assistant .message-timestamp {
        color: #9ca3af;
    }
    
    .typing-indicator {
        display: flex;
        align-items: center;
        column-gap: 4px;
    }
    
    .typing-indicator span {
        width: 7px;
        height: 7px;
        background-color: #9ca3af;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out both;
    }
    
    .typing-indicator span:nth-child(1) {
        animation-delay: -0.32s;
    }
    
    .typing-indicator span:nth-child(2) {
        animation-delay: -0.16s;
    }
    
    @keyframes typing {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
</style>