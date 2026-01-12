import os
from typing import List, Dict
from langchain_community.document_loaders import PyPDFLoader
from app.services.chat import chat_service
from app.db import db
import json

class TextbookAnalyzer:
    async def analyze_textbook(self, material_id: int):
        """
        Analyzes a textbook PDF to extract structure and core concepts.
        1. Load PDF
        2. Extract Text (First 20 pages for TOC/Intro)
        3. LLM: Identify Chapters & Core Concepts (80/20 Rule)
        4. Save to DB Structure
        """
        print(f"Analyzing material {material_id}...")
        
        # 1. Fetch Material info
        material = await db.material.find_unique(where={'id': material_id})
        if not material or not material.url:
            raise ValueError("Material not found or invalid URL")
            
        file_path = material.url
        
        # 2. Load PDF (Head only for structure)
        loader = PyPDFLoader(file_path)
        # We only load the first 20 pages to save tokens and time for the "Structure" pass
        # PyPDFLoader loads all by default, we slice after.
        # Efficient way: load_and_split usually loads all. 
        # For MVP, we load all but only send intro to LLM.
        docs = loader.load()
        
        # 3. Extract TOC / Structure Context
        # Heuristic: TOC is usually in first 20 pages. Index is at end.
        intro_pages = docs[:20]
        intro_text = "\n".join([p.page_content for p in intro_pages])
        
        # 4. LLM Analysis: Structure Extraction
        prompt = f"""
        Analyze the following text (from the beginning of a textbook).
        Identify the Textbook Title and the Table of Contents (Chapters).
        
        For each chapter:
        1. Extract the Title.
        2. Estimate "Importance" (0.0 - 1.0) based on the 80/20 rule (is it a core concept?).
        3. List 3-5 "Key Concepts" covered in that chapter.
        
        Return JSON format ONLY:
        {{
            "title": "Textbook Title",
            "chapters": [
                {{
                    "number": 1,
                    "title": "Chapter Title",
                    "importance": 0.9,
                    "concepts": ["Concept 1", "Concept 2"]
                }}
            ]
        }}
        
        Text Context:
        {intro_text[:4000]}  # Truncate to fit context window if needed
        """
        
        try:
            response = await chat_service.generate_completion(
                prompt, 
                system_prompt="You are an expert curriculum designer and AI analyst. Output raw JSON."
            )
            
            # Clean JSON (sometimes LLM adds markdown blocks)
            cleaned_resp = response.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned_resp)
            
            # 5. Save to DB
            # Create Textbook Entry
            textbook = await db.textbook.create(data={
                'title': data.get('title', material.title),
                'subjectId': material.subjectId if material.subjectId else 1, # Default or link
                'totalChapters': len(data.get('chapters', []))
            })
            
            # Link Material to Textbook (Not in schema yet, but logically linked)
            # Maybe update Exam linkage later.
            
            # Create Chapters & Concepts
            for chip in data.get('chapters', []):
                # Create Chapter
                chapter = await db.chapter.create(data={
                    'textbookId': textbook.id,
                    'number': chip.get('number', 0),
                    'title': chip.get('title', 'Unknown'),
                    'importance': chip.get('importance', 0.5),
                    'isCore': chip.get('importance', 0) > 0.7,
                    'concepts': json.dumps(chip.get('concepts', []))
                })
                
                # Create Concept Nodes (for Graph)
                for concept_name in chip.get('concepts', []):
                    # Check if concept exists
                    existing = await db.concept.find_first(where={
                        'name': concept_name,
                        'subjectId': textbook.subjectId
                    })
                    
                    if not existing:
                        await db.concept.create(data={
                            'name': concept_name,
                            'subjectId': textbook.subjectId,
                            'importance': chip.get('importance', 0.5),
                            'description': f"Extracted from {chapter.title}"
                        })
            
            return {"status": "success", "textbook_id": textbook.id, "chapters": len(data.get('chapters', []))}
            
        except Exception as e:
            print(f"Analysis Failed: {e}")
            # Fallback: Just mark as analyzed?
            raise e

textbook_analyzer = TextbookAnalyzer()
