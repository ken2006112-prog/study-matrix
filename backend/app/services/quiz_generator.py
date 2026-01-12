from app.services.chat import chat_service
from app.services.rag import rag_service
from app.db import db
import json
from typing import List, Optional

class QuizGenerator:
    async def generate_quiz(self, subject_id: Optional[int] = None, concept_ids: Optional[List[int]] = None):
        """
        Generates a quiz based on subject or specific concepts.
        """
        print(f"Generating quiz for subject={subject_id} concepts={concept_ids}")
        
        context_docs = []
        target_topic = "General Knowledge"
        
        # 1. Determine Context
        if concept_ids:
            # Fetch concepts to get names
            concepts = await db.concept.find_many(where={'id': {'in': concept_ids}})
            names = [c.name for c in concepts]
            target_topic = ", ".join(names)
            
            # Retrieve RAG context for these concepts
            for name in names:
                docs = await rag_service.query(name, top_k=2)
                context_docs.extend(docs)
                
        elif subject_id:
            # Fetch random high-importance concepts from subject
            concepts = await db.concept.find_many(
                where={'subjectId': subject_id, 'importance': {'gt': 0.7}},
                take=3
            )
            if not concepts:
                # Fallback if no concepts
                subject = await db.subject.find_unique(where={'id': subject_id})
                target_topic = subject.name if subject else "General"
            else:
                names = [c.name for c in concepts]
                target_topic = ", ".join(names)
                for name in names:
                    docs = await rag_service.query(name, top_k=2)
                    context_docs.extend(docs)
        
        # Deduplicate docs
        unique_docs = {d.page_content: d for d in context_docs}.values()
        context_text = "\n\n".join([d.page_content[:500] for d in unique_docs])
        
        if not context_text:
            context_text = "No specific material found. Generate based on general knowledge of the topic."

        # 2. LLM Generation
        prompt = f"""
        Generate a strictly formatted JSON quiz about: {target_topic}.
        
        Use the following context if available:
        {context_text[:2000]}
        
        Create 3 Multiple Choice Questions.
        Format:
        [
            {{
                "question": "Question text?",
                "options": ["A", "B", "C", "D"],
                "correctIndex": 0,
                "explanation": "Why A is correct..."
            }}
        ]
        
        Output JSON ONLY. No markdown blocks.
        """
        
        try:
            response = await chat_service.generate_completion(
                prompt,
                system_prompt="You are an exam generator. Output strict JSON array."
            )
            
            # Clean
            cleaned = response.replace("```json", "").replace("```", "").strip()
            quiz = json.loads(cleaned)
            return quiz
        except Exception as e:
            print(f"Quiz Gen Error: {e}")
            # Fallback
            return [{
                "question": f"Could not generate quiz for {target_topic}. Error: {str(e)}",
                "options": ["Error"],
                "correctIndex": 0,
                "explanation": "Please try again."
            }]

quiz_generator = QuizGenerator()
