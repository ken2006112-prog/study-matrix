from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
from collections import Counter

router = APIRouter()

class AnalysisResult(BaseModel):
    concepts: List[Dict[str, Any]]
    keyTopics: List[str]
    suggestedFlashcards: List[Dict[str, str]]
    studyPlan: List[Dict[str, Any]]
    twentyEightyAnalysis: Dict[str, Any]

class ExamPattern(BaseModel):
    concept: str
    frequency: int
    weight: float
    lastAppeared: Optional[str] = None

# Simulated NLP extraction (in production, use spaCy or similar)
def extract_concepts_from_text(text: str) -> List[Dict[str, Any]]:
    """Extract key concepts from text using NLP techniques"""
    # Simple keyword extraction based on frequency and patterns
    words = re.findall(r'\b[A-Za-z\u4e00-\u9fff]{2,}\b', text)
    
    # Filter common stop words
    stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 
                  '的', '是', '在', '了', '和', '有', '这', '那', '我', '你'}
    filtered_words = [w for w in words if w.lower() not in stop_words]
    
    # Count frequency
    word_counts = Counter(filtered_words)
    
    # Get top concepts
    concepts = []
    for word, count in word_counts.most_common(20):
        importance = min(1.0, count / 10)  # Normalize importance
        concepts.append({
            "term": word,
            "frequency": count,
            "importance": round(importance, 2),
            "category": categorize_concept(word)
        })
    
    return concepts

def categorize_concept(term: str) -> str:
    """Categorize a concept based on patterns"""
    # Math/Science keywords
    math_keywords = ['函数', '积分', '微分', '方程', 'equation', 'function', 'derivative']
    physics_keywords = ['力', '能量', 'energy', 'force', 'momentum', '动量']
    
    term_lower = term.lower()
    
    if any(k in term_lower for k in math_keywords):
        return "数学概念"
    if any(k in term_lower for k in physics_keywords):
        return "物理概念"
    
    return "一般概念"

def generate_flashcards_from_concepts(concepts: List[Dict]) -> List[Dict[str, str]]:
    """Auto-generate flashcard suggestions from extracted concepts"""
    flashcards = []
    
    for concept in concepts[:10]:  # Top 10 concepts
        term = concept["term"]
        flashcards.append({
            "front": f"什么是 {term}？",
            "back": f"[需要填写 {term} 的定义]",
            "conceptCategory": concept["category"]
        })
        flashcards.append({
            "front": f"举例说明 {term} 的应用",
            "back": f"[需要填写 {term} 的应用实例]",
            "conceptCategory": concept["category"]
        })
    
    return flashcards

def analyze_twenty_eighty(concepts: List[Dict]) -> Dict[str, Any]:
    """Apply 20-80 principle to identify high-value concepts"""
    if not concepts:
        return {"highValue": [], "lowValue": [], "recommendation": ""}
    
    # Sort by importance
    sorted_concepts = sorted(concepts, key=lambda x: x["importance"], reverse=True)
    
    # Top 20% are high-value
    cutoff = max(1, len(sorted_concepts) // 5)
    high_value = sorted_concepts[:cutoff]
    low_value = sorted_concepts[cutoff:]
    
    total_importance = sum(c["importance"] for c in concepts)
    high_value_importance = sum(c["importance"] for c in high_value)
    
    coverage = (high_value_importance / total_importance * 100) if total_importance > 0 else 0
    
    return {
        "highValueConcepts": [c["term"] for c in high_value],
        "lowValueConcepts": [c["term"] for c in low_value[:5]],
        "coveragePercent": round(coverage, 1),
        "recommendation": f"优先学习这 {len(high_value)} 个核心概念，可覆盖约 {round(coverage)}% 的重要内容"
    }

@router.post("/analyze-text")
async def analyze_text(text: str, subjectId: Optional[int] = None):
    """Analyze text content and extract learning insights"""
    if len(text) < 50:
        raise HTTPException(status_code=400, detail="Text too short for analysis")
    
    # Extract concepts
    concepts = extract_concepts_from_text(text)
    
    # Generate flashcards
    flashcards = generate_flashcards_from_concepts(concepts)
    
    # 20-80 analysis
    twenty_eighty = analyze_twenty_eighty(concepts)
    
    # Generate study plan
    study_plan = []
    for i, concept in enumerate(concepts[:5]):
        study_plan.append({
            "day": i + 1,
            "concept": concept["term"],
            "activity": "主动回憶" if i % 2 == 0 else "练习题",
            "estimatedMinutes": 20 + (concept["importance"] * 30)
        })
    
    return AnalysisResult(
        concepts=concepts,
        keyTopics=[c["term"] for c in concepts[:5]],
        suggestedFlashcards=flashcards,
        studyPlan=study_plan,
        twentyEightyAnalysis=twenty_eighty
    )

@router.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    """Analyze uploaded PDF and extract concepts"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Read file content
        content = await file.read()
        
        # In production, use pdfplumber:
        # import pdfplumber
        # with pdfplumber.open(io.BytesIO(content)) as pdf:
        #     text = "\n".join(page.extract_text() for page in pdf.pages)
        
        # For now, return mock analysis
        return {
            "success": True,
            "filename": file.filename,
            "pageCount": 10,  # Mock
            "concepts": [
                {"term": "积分", "importance": 0.9},
                {"term": "微分", "importance": 0.85},
                {"term": "极限", "importance": 0.8}
            ],
            "flashcardsGenerated": 6,
            "message": "PDF分析完成（示例数据）。完整解析需安装pdfplumber。"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-exam")
async def analyze_exam(
    examQuestions: List[str],
    subjectId: Optional[int] = None
):
    """Analyze exam questions to identify patterns"""
    all_concepts = []
    
    for question in examQuestions:
        concepts = extract_concepts_from_text(question)
        all_concepts.extend(concepts)
    
    # Aggregate concept frequencies
    concept_counts = {}
    for c in all_concepts:
        term = c["term"]
        if term in concept_counts:
            concept_counts[term]["frequency"] += 1
        else:
            concept_counts[term] = {"term": term, "frequency": 1}
    
    # Sort by frequency
    sorted_concepts = sorted(
        concept_counts.values(),
        key=lambda x: x["frequency"],
        reverse=True
    )
    
    # Calculate weights
    total_freq = sum(c["frequency"] for c in sorted_concepts)
    for c in sorted_concepts:
        c["weight"] = round(c["frequency"] / total_freq, 3) if total_freq > 0 else 0
    
    # 20-80 analysis
    high_value = sorted_concepts[:max(1, len(sorted_concepts) // 5)]
    high_value_weight = sum(c["weight"] for c in high_value)
    
    return {
        "examPatterns": sorted_concepts[:10],
        "totalQuestionsAnalyzed": len(examQuestions),
        "uniqueConcepts": len(sorted_concepts),
        "twentyEightyInsight": {
            "topConcepts": [c["term"] for c in high_value],
            "coveragePercent": round(high_value_weight * 100, 1),
            "recommendation": f"专注这 {len(high_value)} 个概念可覆盖约 {round(high_value_weight * 100)}% 的考试内容"
        },
        "studySuggestion": "建议按频率排序复习，优先攻克高频考点"
    }
