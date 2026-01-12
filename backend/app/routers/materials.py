from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
from datetime import datetime

router = APIRouter()
from app.services.textbook_analyzer import textbook_analyzer

@router.post("/analyze/{material_id}")
async def analyze_textbook(material_id: int):
    """
    Trigger deep analysis of a textbook PDF.
    Extracts TOC, Chapters, and Core Concepts.
    """
    try:
        result = await textbook_analyzer.analyze_textbook(material_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UploadResponse(BaseModel):
    filename: str
    text_content: str
    concepts: List[dict]
    generated_cards: List[dict]

class MaterialMetadata(BaseModel):
    id: int
    filename: str
    uploadedAt: str
    conceptCount: int
    cardCount: int

# Store uploaded materials metadata (in production, use database)
uploaded_materials: List[dict] = []

@router.post("/upload", response_model=UploadResponse)
async def upload_material(
    file: UploadFile = File(...),
    subject_id: Optional[int] = None,
    material_type: str = "notes"  # "notes", "exam", "textbook"
):
    """
    上傳教材或考古題，自動解析並生成閃卡
    
    支援格式: .txt, .pdf, .md
    material_type: notes (筆記), exam (考古題), textbook (教科書)
    """
    # Validate file type
    allowed_extensions = ['.txt', '.pdf', '.md', '.docx']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"不支援的格式: {ext}。支援: {', '.join(allowed_extensions)}"
        )
    
    # Read file content
    content = await file.read()
    text_content = ""
    
    if ext == '.txt' or ext == '.md':
        text_content = content.decode('utf-8')
    elif ext == '.pdf':
        # PDF parsing - in production use PyPDF2 or pdfplumber
        try:
            import io
            # Simplified - in production use proper PDF library
            text_content = f"[PDF 內容需要 pdfplumber 解析]\n上傳的檔案: {file.filename}"
        except Exception as e:
            text_content = f"PDF 解析失敗: {str(e)}"
    else:
        text_content = content.decode('utf-8', errors='ignore')
    
    # Save file to disk
    upload_path = os.path.join(r"backend/data/uploads", file.filename)
    # Ensure directory exists (redundant if mkdir run, but safe)
    os.makedirs(os.path.dirname(upload_path), exist_ok=True)
    
    with open(upload_path, "wb") as buffer:
        buffer.write(content)
        
    # Store in DB first to get ID
    from app.db import db
    material = await db.material.create({
        "userId": 1, # Hardcoded for now until auth context is fully passed
        "title": file.filename,
        "type": ext.replace(".", ""),
        "url": upload_path,
        "isIndexed": False
    })

    # Ingest into RAG (Async)
    # In production, use background tasks (Celery/arq)
    from app.services.rag import rag_service
    try:
        chunk_count = await rag_service.ingest_material(upload_path, material.id)
    except Exception as e:
        print(f"RAG Ingestion failed: {e}")
        chunk_count = 0
    
    # NLP Extraction (Keep existing logic or replace? keeping for concept cloud)
    from app.services.nlp import nlp_service
    documents = [line for line in text_content.split('\n') if line.strip()]
    concepts = nlp_service.extract_concepts(documents) if documents else []
    
    # Generate flashcards (Keep existing logic)
    generated_cards = await generate_cards_from_content(
        text_content, 
        material_type,
        subject_id
    )
    
    uploaded_materials.append({
        "id": material.id,
        "filename": file.filename,
        "uploadedAt": datetime.now().isoformat(),
        "conceptCount": len(concepts),
        "cardCount": len(generated_cards),
        "subjectId": subject_id,
        "type": material_type
    })
    
    return UploadResponse(
        filename=file.filename,
        text_content=text_content[:200] + "..." if len(text_content) > 200 else text_content,
        concepts=concepts,
        generated_cards=generated_cards
    )


async def generate_cards_from_content(
    content: str, 
    material_type: str,
    subject_id: Optional[int]
) -> List[dict]:
    """使用 AI 從教材內容生成閃卡"""
    from app.services.chat import chat_service
    
    type_prompts = {
        "notes": "這是課程筆記。找出最重要的概念，生成問答卡片。",
        "exam": "這是考古題。將每道題目轉換為問答卡片，包含解題思路。",
        "textbook": "這是教科書內容。提取關鍵定義、公式和概念。"
    }
    
    prompt = f"""
    {type_prompts.get(material_type, type_prompts['notes'])}
    
    內容:
    {content[:3000]}
    
    請生成 5-10 張閃卡，格式為 JSON 陣列:
    [
      {{"front": "問題", "back": "答案/解釋"}}
    ]
    
    只回傳 JSON，不要其他文字。
    """
    
    try:
        response = await chat_service.generate_completion(
            prompt,
            system_prompt="你是教育專家，擅長將教材轉換為有效的學習閃卡。"
        )
        
        # Parse JSON response
        import json
        # Find JSON array in response
        start = response.find('[')
        end = response.rfind(']') + 1
        if start != -1 and end > start:
            cards_json = response[start:end]
            cards = json.loads(cards_json)
            return cards
    except Exception as e:
        print(f"Card generation failed: {e}")
    
    # Fallback: generate simple cards from concepts
    return [
        {"front": f"什麼是 {content[:50]}?", "back": "請根據教材內容回答"},
    ]


@router.get("/", response_model=List[MaterialMetadata])
async def get_materials():
    """獲取所有已上傳的教材"""
    return [MaterialMetadata(**m) for m in uploaded_materials]


@router.delete("/{material_id}")
async def delete_material(material_id: int):
    """刪除教材"""
    global uploaded_materials
    uploaded_materials = [m for m in uploaded_materials if m["id"] != material_id]
    return {"status": "deleted"}
