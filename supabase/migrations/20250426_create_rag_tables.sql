-- Create tables for RAG (Retrieval-Augmented Generation) functionality

-- Table for storing documents
CREATE TABLE IF NOT EXISTS public.rag_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'url', 'file')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(1536), -- For OpenAI embeddings (ada-002 model)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Table for storing knowledge bases
CREATE TABLE IF NOT EXISTS public.rag_knowledge_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    document_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Table for storing chat history
CREATE TABLE IF NOT EXISTS public.rag_chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_base_id UUID REFERENCES public.rag_knowledge_bases(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Documents policies
CREATE POLICY "Users can view their own documents" 
    ON public.rag_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
    ON public.rag_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
    ON public.rag_documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
    ON public.rag_documents FOR DELETE
    USING (auth.uid() = user_id);

-- Knowledge bases policies
CREATE POLICY "Users can view their own knowledge bases" 
    ON public.rag_knowledge_bases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge bases" 
    ON public.rag_knowledge_bases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge bases" 
    ON public.rag_knowledge_bases FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge bases" 
    ON public.rag_knowledge_bases FOR DELETE
    USING (auth.uid() = user_id);

-- Chat history policies
CREATE POLICY "Users can view their own chat history" 
    ON public.rag_chat_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history" 
    ON public.rag_chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history" 
    ON public.rag_chat_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history" 
    ON public.rag_chat_history FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx ON public.rag_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS rag_documents_user_id_idx ON public.rag_documents(user_id);
CREATE INDEX IF NOT EXISTS rag_knowledge_bases_user_id_idx ON public.rag_knowledge_bases(user_id);
CREATE INDEX IF NOT EXISTS rag_chat_history_knowledge_base_id_idx ON public.rag_chat_history(knowledge_base_id);
