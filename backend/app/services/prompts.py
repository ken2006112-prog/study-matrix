"""
AI Socratic Prompt Templates
蘇格拉底式 AI 提問模板庫

核心原則：AI 永遠用「提問」而非「告知」的方式互動
"""

from typing import Dict, List, Optional
from enum import Enum
import random

class PromptCategory(Enum):
    UNDERSTANDING = "understanding"  # 理解確認
    PRIORITY = "priority"            # 優先級決策
    STRATEGY = "strategy"            # 策略選擇
    REFLECTION = "reflection"        # 學習反思
    PLANNING = "planning"            # 計畫調整
    MOTIVATION = "motivation"        # 動機激發

# ============================================
# 1. 理解確認類（Self-Explanation Prompts）
# ============================================

UNDERSTANDING_PROMPTS = [
    # Feynman 技巧
    {
        "template": "不看筆記，用你自己的話解釋「{concept}」給一個初學者聽。",
        "purpose": "強迫自我解釋，發現理解漏洞",
        "follow_up": "很好！那你覺得哪個部分最容易被誤解？"
    },
    {
        "template": "如果你是老師，你會怎麼用一個例子來教「{concept}」？",
        "purpose": "從教學角度深化理解",
        "follow_up": "這個例子很棒！那如果學生問『為什麼』，你會怎麼回答？"
    },
    {
        "template": "「{concept}」和你之前學過的什麼概念最像？有什麼不同？",
        "purpose": "建立知識連結",
        "follow_up": "你抓到了關鍵差異！這個連結之後會幫助你記憶。"
    },
    {
        "template": "如果用一句話總結「{concept}」的核心，你會怎麼說？",
        "purpose": "提煉核心理解",
        "follow_up": "簡潔有力！讓我補充一個角度..."
    },
    {
        "template": "你覺得「{concept}」最重要的三個要點是什麼？",
        "purpose": "結構化理解",
        "follow_up": "第二點特別關鍵！考試很常從這裡出題。"
    }
]

# ============================================
# 2. 優先級決策類（Decision Support Prompts）
# ============================================

PRIORITY_PROMPTS = [
    {
        "template": "今天你有 {hours} 小時，你覺得應該先補弱項還是拉強項？",
        "purpose": "讓用戶自己決定策略",
        "options": ["補弱項", "拉強項", "讓 AI 建議"],
        "follow_up": {
            "補弱項": "好的選擇！弱項補起來整體分數提升最大。",
            "拉強項": "也是一個策略！鞏固優勢可以建立信心。",
            "讓 AI 建議": "根據你的數據，我建議先處理 {weak_subject}，因為它對總分影響最大。"
        }
    },
    {
        "template": "這一科你想用什麼方式學？\n1. 先讀一遍\n2. 直接做題\n3. 用 Flashcard 記重點",
        "purpose": "了解學習偏好",
        "follow_up": "記住了！下次我會優先推薦這種方式。"
    },
    {
        "template": "如果這週只能學一科，你會選哪一科？為什麼？",
        "purpose": "迫使用戶思考優先級",
        "follow_up": "這個選擇反映了你的直覺判斷，其實很準確！"
    },
    {
        "template": "考試還有 {days} 天，你現在最擔心哪一個部分？",
        "purpose": "識別焦慮源頭",
        "follow_up": "讓我們把這個擔心變成具體行動..."
    }
]

# ============================================
# 3. 策略選擇類（Strategy Selection Prompts）
# ============================================

STRATEGY_PROMPTS = [
    {
        "template": "上次用「{strategy}」學習效果如何？要不要換一種試試？",
        "purpose": "策略反思與調整",
        "options": ["效果很好，繼續", "效果普通，換一種", "不確定"]
    },
    {
        "template": "這章內容偏向：\n1. 理解概念\n2. 記憶事實\n3. 練習技巧\n你覺得哪一種？",
        "purpose": "匹配正確策略",
        "follow_up": {
            "理解概念": "建議用 Feynman 技巧，逼自己用簡單的話解釋。",
            "記憶事實": "建議用 Flashcard + 間隔複習。",
            "練習技巧": "建議多做題，從錯題中學習。"
        }
    },
    {
        "template": "你比較喜歡：\n1. 自己安靜讀書\n2. 邊讀邊做筆記\n3. 跟別人討論",
        "purpose": "了解學習風格",
        "follow_up": "了解！我會記住你的偏好，未來建議會更貼近你的風格。"
    }
]

# ============================================
# 4. 學習反思類（Reflection Prompts）
# ============================================

REFLECTION_PROMPTS = [
    {
        "template": "剛才這 {minutes} 分鐘，專注度大概是多少？（0-100%）",
        "purpose": "時間誠實度追蹤",
        "follow_up": {
            "high": "太棒了！這樣的狀態很珍貴，要好好利用。",
            "medium": "正常水準！如果感覺走神，可以換個方式。",
            "low": "沒關係，我們來看看是什麼讓你分心..."
        }
    },
    {
        "template": "這次學習，你覺得最大的收穫是什麼？",
        "purpose": "正向強化",
        "follow_up": "很好！這個收穫會記錄下來，之後可以複習。"
    },
    {
        "template": "如果重來一次，你會怎麼安排這段學習時間？",
        "purpose": "後設認知訓練",
        "follow_up": "這個洞察很重要！下次我會提醒你。"
    },
    {
        "template": "今天學的內容，明天你還記得多少？給自己打個分。",
        "purpose": "自評記憶強度",
        "follow_up": "根據這個評估，我會在最佳時間安排複習。"
    }
]

# ============================================
# 5. 計畫調整類（Adaptive Planning Prompts）
# ============================================

PLANNING_PROMPTS = [
    {
        "template": "今天的計畫有點多，你想：\n1. 照計畫走\n2. 只做最重要的 3 件\n3. 今天休息明天補",
        "purpose": "給用戶調整權",
        "follow_up": {
            "1": "好的！如果中途太累，隨時可以調整。",
            "2": "聰明選擇！我幫你挑 3 件最關鍵的。",
            "3": "休息也是學習的一部分。明天的計畫我會幫你調整。"
        }
    },
    {
        "template": "這週計畫完成率是 {rate}%，你覺得是計畫太多還是干擾太多？",
        "purpose": "找出偏離原因",
        "follow_up": "了解了。下週我會調整負荷/提醒你減少干擾。"
    },
    {
        "template": "接下來這一小時，你想用在哪一科？",
        "purpose": "即時決策",
        "follow_up": "好的！我幫你設定一個 {minutes} 分鐘的專注時段。"
    }
]

# ============================================
# 6. 動機激發類（Motivation Prompts）
# ============================================

MOTIVATION_PROMPTS = [
    {
        "template": "你已經連續 {days} 天學習了！要繼續保持嗎？",
        "purpose": "連勝機制",
        "follow_up": "你的毅力是最大的優勢！"
    },
    {
        "template": "比起上週，你在「{subject}」進步了 {percent}%！",
        "purpose": "數據驅動鼓勵",
        "follow_up": "這不是運氣，是你努力的結果。"
    },
    {
        "template": "記住：完成比完美重要。今天只要學 10 分鐘也算數。",
        "purpose": "降低門檻",
        "follow_up": "10 分鐘後，你可以選擇繼續或停止。"
    },
    {
        "template": "你不是懶，你只是高估了「{time_of_day}」的自己。",
        "purpose": "行為科學式安慰",
        "follow_up": "讓我們調整計畫，把難的任務放到你狀態好的時候。"
    }
]

# ============================================
# 主函數：獲取適當的提問
# ============================================

ALL_PROMPTS = {
    PromptCategory.UNDERSTANDING: UNDERSTANDING_PROMPTS,
    PromptCategory.PRIORITY: PRIORITY_PROMPTS,
    PromptCategory.STRATEGY: STRATEGY_PROMPTS,
    PromptCategory.REFLECTION: REFLECTION_PROMPTS,
    PromptCategory.PLANNING: PLANNING_PROMPTS,
    PromptCategory.MOTIVATION: MOTIVATION_PROMPTS,
}

def get_prompt(
    category: PromptCategory,
    context: Optional[Dict] = None
) -> Dict:
    """
    獲取指定類別的隨機提問模板
    
    Args:
        category: 提問類別
        context: 上下文變數（如 concept, hours, days 等）
    
    Returns:
        格式化後的提問
    """
    prompts = ALL_PROMPTS.get(category, UNDERSTANDING_PROMPTS)
    prompt = random.choice(prompts)
    
    # 格式化模板
    template = prompt["template"]
    if context:
        template = template.format(**context)
    
    return {
        "question": template,
        "purpose": prompt.get("purpose", ""),
        "options": prompt.get("options"),
        "follow_up": prompt.get("follow_up")
    }

def get_understanding_prompt(concept: str) -> Dict:
    """獲取理解確認提問"""
    return get_prompt(PromptCategory.UNDERSTANDING, {"concept": concept})

def get_priority_prompt(hours: float = 2, days: int = 7) -> Dict:
    """獲取優先級決策提問"""
    return get_prompt(PromptCategory.PRIORITY, {"hours": hours, "days": days})

def get_reflection_prompt(minutes: int = 30) -> Dict:
    """獲取學習反思提問"""
    return get_prompt(PromptCategory.REFLECTION, {"minutes": minutes})

def get_motivation_prompt(
    days: int = 1, 
    subject: str = "這科", 
    percent: int = 10,
    time_of_day: str = "晚上"
) -> Dict:
    """獲取動機激發提問"""
    return get_prompt(PromptCategory.MOTIVATION, {
        "days": days,
        "subject": subject,
        "percent": percent,
        "time_of_day": time_of_day
    })
