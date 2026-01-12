
import os
from typing import List, Optional
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from app.db import db
import shutil

# Configuration
CHROMA_PATH = os.path.join(os.getcwd(), "data/chroma_db")
UPLOAD_DIR = os.path.join(os.getcwd(), "data/uploads")

class RAGService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True,
        )

    def _get_vectorstore(self):
        """Get or create Chroma vectorstore instance"""
        return Chroma(
            persist_directory=CHROMA_PATH,
            embedding_function=self.embeddings
        )

    async def ingest_material(self, file_path: str, material_id: int):
        """
        Process a file: Load -> Split -> Embed -> Store
        Returns number of chunks created.
        """
        # 1. Load
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
            docs = loader.load()
        elif ext in [".txt", ".md"]:
            loader = TextLoader(file_path)
            docs = loader.load()
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        # 2. Split
        chunks = self.text_splitter.split_documents(docs)
        
        # Add metadata to each chunk
        for chunk in chunks:
            chunk.metadata["material_id"] = material_id

        # 3. Embed & Store
        vectorstore = self._get_vectorstore()
        vectorstore.add_documents(chunks)
        
        # 4. Update Database
        await db.material.update(
            where={"id": material_id},
            data={
                "isIndexed": True,
                "chunkCount": len(chunks)
            }
        )
        
        return len(chunks)

    async def query(self, query: str, top_k: int = 5, subject_id: Optional[int] = None) -> List[Document]:
        """
        Semantic search for the query.
        """
        vectorstore = self._get_vectorstore()
        
        # Use filter if subject_id is provided logic needs database join, 
        # simpler to filter by material_id if we have that mapping. 
        # For now, global search or filter by metadata if we stored subject_id there.
        # We only stored material_id.
        
        results = vectorstore.similarity_search(query, k=top_k)
        return results

    async def get_socratic_response_with_context(self, query: str, context: List[Document]) -> str:
        """
        Generate a response (Stub for Integration, actual LLM call should be in Chat Service or here)
        """
        from app.services.chat import chat_service
        
        context_str = "\n\n".join([f"[Source: {d.metadata.get('source', 'unknown')}]\n{d.page_content}" for d in context])
        
        system_prompt = """You are an AI Tutor. Answer the student's question based strictly on the provided context.
If the answer is not in the context, say "This topic isn't covered in your uploaded notes."
Cite your sources (e.g., "According to lecture 1...").
"""
        user_prompt = f"""Context:
{context_str}

Question: {query}
"""
        response = await chat_service.generate_completion(
            prompt=user_prompt,
            system_prompt=system_prompt
        )
        return response

rag_service = RAGService()
