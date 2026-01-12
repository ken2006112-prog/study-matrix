from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import re
from collections import Counter

router = APIRouter()

# === Models ===
class ConceptWeight(BaseModel):
    name: str
    weight: float  # 0-100, higher = more important
    category: str  # "core", "support", "detail"
    examFrequency: int  # times appeared in past exams
    chapterRef: Optional[str] = None

class MaterialAnalysis(BaseModel):
    title: str
    totalConcepts: int
    coreConcepts: List[ConceptWeight]  # 20% that covers 80%
    supportConcepts: List[ConceptWeight]
    detailConcepts: List[ConceptWeight]
    suggestedStudyOrder: List[str]
    tagCloud: List[Dict[str, Any]]

class ExamAnalysis(BaseModel):
    examName: str
    totalQuestions: int
    topicDistribution: Dict[str, int]
    highFrequencyTopics: List[str]
    lowFrequencyTopics: List[str]
    recommendations: List[str]

# === NLP Utilities ===
def extract_keywords(text: str, top_n: int = 30) -> List[Dict[str, Any]]:
    """
    Extract keywords from text using simple frequency analysis
    In production, would use actual NLP models
    """
    # Common Chinese stop words
    stop_words = {"的", "是", "在", "和", "了", "有", "這", "我", "他", "她", "它", 
                  "們", "你", "會", "可以", "就", "也", "不", "但", "或", "如果",
                  "因為", "所以", "而", "且", "則", "又", "並", "即", "此", "其"}
    
    # Extract Chinese words (simplified - in production use jieba or similar)
    words = re.findall(r'[\u4e00-\u9fff]{2,6}', text)
    
    # Filter stop words and count
    filtered_words = [w for w in words if w not in stop_words and len(w) >= 2]
    word_counts = Counter(filtered_words)
    
    # Get top N
    top_words = word_counts.most_common(top_n)
    max_count = top_words[0][1] if top_words else 1
    
    return [
        {
            "text": word,
            "count": count,
            "weight": round((count / max_count) * 100, 1)
        }
        for word, count in top_words
    ]

def categorize_concepts(keywords: List[Dict[str, Any]]) -> Dict[str, List[ConceptWeight]]:
    """
    Apply 20-80 principle to categorize concepts
    """
    total = len(keywords)
    core_count = max(1, int(total * 0.2))
    support_count = max(1, int(total * 0.3))
    
    result = {"core": [], "support": [], "detail": []}
    
    for i, kw in enumerate(keywords):
        if i < core_count:
            category = "core"
        elif i < core_count + support_count:
            category = "support"
        else:
            category = "detail"
        
        result[category].append(ConceptWeight(
            name=kw["text"],
            weight=kw["weight"],
            category=category,
            examFrequency=max(1, int(kw["weight"] / 10))  # Simulated
        ))
    
    return result


@router.post("/parse-material")
async def parse_material(
    title: str = Form("學習材料"),
    content: str = Form(...)
):
    """
    解析教材內容，提取關鍵概念並應用 20-80 原則
    """
    # Extract keywords
    keywords = extract_keywords(content)
    
    # Categorize by importance
    categorized = categorize_concepts(keywords)
    
    # Generate tag cloud data
    tag_cloud = [
        {
            "text": kw["text"],
            "value": kw["weight"],
            "category": "core" if i < len(keywords) * 0.2 else "support" if i < len(keywords) * 0.5 else "detail"
        }
        for i, kw in enumerate(keywords)
    ]
    
    # Suggested study order (core concepts first)
    study_order = [c.name for c in categorized["core"]] + \
                  [c.name for c in categorized["support"][:3]]
    
    return MaterialAnalysis(
        title=title,
        totalConcepts=len(keywords),
        coreConcepts=categorized["core"],
        supportConcepts=categorized["support"],
        detailConcepts=categorized["detail"],
        suggestedStudyOrder=study_order,
        tagCloud=tag_cloud
    )


@router.post("/parse-exam")
async def parse_exam(
    examName: str = Form("歷屆試題"),
    content: str = Form(...)
):
    """
    解析歷屆試題，找出高頻考點
    """
    # Extract keywords (representing topics)
    keywords = extract_keywords(content, top_n=20)
    
    # Simulate topic distribution
    topic_dist = {kw["text"]: kw["count"] for kw in keywords[:15]}
    
    # High frequency (top 20%)
    high_freq = [kw["text"] for kw in keywords[:max(1, len(keywords) // 5)]]
    
    # Low frequency (bottom 30%)
    low_freq = [kw["text"] for kw in keywords[-(len(keywords) // 3):]]
    
    recommendations = [
        f"「{high_freq[0]}」是高頻考點，建議優先複習" if high_freq else "需要更多數據分析",
        "建議用主動回憶練習高頻概念",
        "低頻考點可以考前再快速瀏覽"
    ]
    
    return ExamAnalysis(
        examName=examName,
        totalQuestions=len(keywords) * 5,  # Estimate
        topicDistribution=topic_dist,
        highFrequencyTopics=high_freq,
        lowFrequencyTopics=low_freq,
        recommendations=recommendations
    )


@router.get("/concept-relations")
async def get_concept_relations(subjectId: int = 1):
    """
    獲取概念關聯圖數據
    """
    # Demo data - in production would be from actual NLP analysis
    nodes = [
        {"id": "1", "name": "極限", "weight": 90, "type": "core"},
        {"id": "2", "name": "連續", "weight": 70, "type": "support"},
        {"id": "3", "name": "導數", "weight": 95, "type": "core"},
        {"id": "4", "name": "連鎖律", "weight": 75, "type": "support"},
        {"id": "5", "name": "積分", "weight": 85, "type": "core"},
        {"id": "6", "name": "微分方程", "weight": 60, "type": "support"},
        {"id": "7", "name": "Taylor展開", "weight": 65, "type": "support"},
    ]
    
    edges = [
        {"source": "1", "target": "2", "relation": "是...的基礎"},
        {"source": "1", "target": "3", "relation": "定義依賴"},
        {"source": "3", "target": "4", "relation": "應用"},
        {"source": "3", "target": "5", "relation": "反運算"},
        {"source": "5", "target": "6", "relation": "應用"},
        {"source": "3", "target": "7", "relation": "應用"},
    ]
    
    return {
        "nodes": nodes,
        "edges": edges,
        "recommendation": "從「極限」開始，它是其他概念的基礎"
    }


@router.get("/pareto-analysis/{subjectId}")
async def get_pareto_analysis(subjectId: int):
    """
    20-80 分析：找出高價值概念
    """
    # Demo analysis results
    all_concepts = [
        {"name": "極限", "examWeight": 25, "cumulative": 25},
        {"name": "導數", "examWeight": 22, "cumulative": 47},
        {"name": "積分", "examWeight": 18, "cumulative": 65},
        {"name": "連鎖律", "examWeight": 10, "cumulative": 75},
        {"name": "Taylor展開", "examWeight": 8, "cumulative": 83},
        {"name": "連續性", "examWeight": 5, "cumulative": 88},
        {"name": "微分方程", "examWeight": 5, "cumulative": 93},
        {"name": "極值問題", "examWeight": 4, "cumulative": 97},
        {"name": "曲線描繪", "examWeight": 3, "cumulative": 100},
    ]
    
    # Find 80% threshold
    core_concepts = [c for c in all_concepts if c["cumulative"] <= 80]
    
    return {
        "subjectId": subjectId,
        "analysis": all_concepts,
        "coreConcepts": core_concepts,
        "coreCount": len(core_concepts),
        "totalCount": len(all_concepts),
        "insight": f"專注這 {len(core_concepts)} 個概念，可以掌握 80% 的考試範圍",
        "studyPriority": [c["name"] for c in core_concepts]
    }
