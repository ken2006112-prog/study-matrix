from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from app.db import db
import random

router = APIRouter()

class EncouragementResponse(BaseModel):
    message: str
    type: str  # "progress", "streak", "improvement", "support"
    data: Optional[dict] = None
    emoji: str

# Encouragement templates
PROGRESS_MESSAGES = [
    "🎉 太棒了！你這週已經學習了 {hours} 小時，比上週多 {increase}%！",
    "📈 進步明顯！{subject} 的掌握度提升了 {points} 個百分點！",
    "⭐ 你已經連續 {days} 天完成學習計畫，繼續保持！",
    "🏆 厲害！本週完成了 {tasks} 個任務，效率超高！"
]

STREAK_MESSAGES = [
    "🔥 連續 {days} 天學習！你正在建立一個強大的習慣！",
    "💪 {days} 天連勝！每一天的堅持都讓你更接近目標！",
    "🌟 太強了！已經連續 {days} 天保持學習，這就是冠軍的節奏！"
]

IMPROVEMENT_MESSAGES = [
    "📊 {subject} 最難的部分你已經搞定了！繼續攻克下一個！",
    "🧠 你的記憶保持率達到 {retention}%，這代表你真的學會了！",
    "✅ 這章你已經掌握 {mastery}%，距離完全掌握不遠了！"
]

SUPPORT_MESSAGES = [
    "🌈 今天有點累也沒關係，休息一下再來！",
    "💡 學習這章確實有難度，但你已經比昨天進步了！",
    "❤️ 記住：進步比完美更重要。今天的你比昨天更強！",
    "🌱 每個小進步都是大成就的一部分，你做得很好！"
]

BURNOUT_PREVENTION = [
    "⚠️ 你已經連續學習 {hours} 小時了，該休息一下了！",
    "☕ 建議：休息15分鐘，喝杯水，伸展一下！",
    "🧘 大腦需要休息來鞏固記憶，現在是散步的好時機！"
]

async def get_user_stats(user_id: int) -> dict:
    """Get user learning statistics"""
    # Get study sessions from last 7 days
    week_ago = datetime.now() - timedelta(days=7)
    two_weeks_ago = datetime.now() - timedelta(days=14)
    
    this_week_sessions = await db.studysession.find_many(
        where={
            "userId": user_id,
            "startTime": {"gte": week_ago}
        }
    )
    
    last_week_sessions = await db.studysession.find_many(
        where={
            "userId": user_id,
            "startTime": {"gte": two_weeks_ago, "lt": week_ago}
        }
    )
    
    # Calculate hours
    this_week_hours = sum(s.duration or 0 for s in this_week_sessions) / 60
    last_week_hours = sum(s.duration or 0 for s in last_week_sessions) / 60
    
    # Get completed tasks
    completed_tasks = await db.task.count(
        where={
            "userId": user_id,
            "isCompleted": True,
            "updatedAt": {"gte": week_ago}
        }
    )
    
    # Calculate streak (simplified)
    streak = min(len(set(s.startTime.date() for s in this_week_sessions)), 7)
    
    return {
        "thisWeekHours": round(this_week_hours, 1),
        "lastWeekHours": round(last_week_hours, 1),
        "weeklyImprovement": round((this_week_hours - last_week_hours) / max(last_week_hours, 1) * 100, 1),
        "completedTasks": completed_tasks,
        "streak": streak
    }

@router.get("/encouragement")
async def get_daily_encouragement(userId: int = 1):
    """
    Generate personalized, data-driven encouragement message
    """
    try:
        stats = await get_user_stats(userId)
        
        # Determine message type based on stats
        if stats["streak"] >= 3:
            # Streak message
            template = random.choice(STREAK_MESSAGES)
            message = template.format(days=stats["streak"])
            msg_type = "streak"
            emoji = "🔥"
        elif stats["weeklyImprovement"] > 10:
            # Progress message
            template = random.choice(PROGRESS_MESSAGES)
            message = template.format(
                hours=stats["thisWeekHours"],
                increase=stats["weeklyImprovement"],
                tasks=stats["completedTasks"],
                subject="你的科目",
                points=10,
                days=stats["streak"]
            )
            msg_type = "progress"
            emoji = "📈"
        elif stats["thisWeekHours"] >= 10:
            # Good effort
            template = "✨ 你這週已經學了 {hours} 小時，這是很棒的投入！繼續保持！"
            message = template.format(hours=stats["thisWeekHours"])
            msg_type = "progress"
            emoji = "✨"
        else:
            # Support message
            message = random.choice(SUPPORT_MESSAGES)
            msg_type = "support"
            emoji = "💪"
        
        return EncouragementResponse(
            message=message,
            type=msg_type,
            data=stats,
            emoji=emoji
        )
        
    except Exception as e:
        return EncouragementResponse(
            message="每一天的學習都是進步！今天也要加油！💪",
            type="support",
            emoji="💪"
        )

@router.get("/burnout-check")
async def check_burnout(userId: int = 1):
    """
    Check if user needs a break based on recent study patterns
    """
    # Get today's study time
    today_start = datetime.now().replace(hour=0, minute=0, second=0)
    
    today_sessions = await db.studysession.find_many(
        where={
            "userId": userId,
            "startTime": {"gte": today_start}
        }
    )
    
    today_hours = sum(s.duration or 0 for s in today_sessions) / 60
    
    if today_hours >= 4:
        return {
            "needsBreak": True,
            "message": random.choice(BURNOUT_PREVENTION).format(hours=round(today_hours, 1)),
            "studyHoursToday": round(today_hours, 1),
            "recommendation": "建議休息 15-30 分鐘"
        }
    elif today_hours >= 2:
        return {
            "needsBreak": False,
            "message": "你正在保持健康的學習節奏！",
            "studyHoursToday": round(today_hours, 1),
            "recommendation": "繼續保持，但記得適時休息"
        }
    else:
        return {
            "needsBreak": False,
            "message": "今天才剛開始，加油！",
            "studyHoursToday": round(today_hours, 1),
            "recommendation": None
        }

@router.get("/weekly-summary")
async def get_weekly_summary(userId: int = 1):
    """
    Get weekly learning summary with encouragement
    """
    stats = await get_user_stats(userId)
    
    # Generate summary
    summary_points = []
    
    if stats["thisWeekHours"] > 0:
        summary_points.append(f"📚 本週學習 {stats['thisWeekHours']} 小時")
    
    if stats["completedTasks"] > 0:
        summary_points.append(f"✅ 完成 {stats['completedTasks']} 個任務")
    
    if stats["streak"] > 0:
        summary_points.append(f"🔥 連續學習 {stats['streak']} 天")
    
    if stats["weeklyImprovement"] > 0:
        summary_points.append(f"📈 比上週進步 {stats['weeklyImprovement']}%")
    
    # Determine overall mood
    if stats["weeklyImprovement"] > 20:
        mood = "excellent"
        overall = "太棒了！這是你表現最好的一週之一！🏆"
    elif stats["weeklyImprovement"] > 0:
        mood = "good"
        overall = "不錯的一週！你在穩步進步中。✨"
    elif stats["thisWeekHours"] > 5:
        mood = "okay"
        overall = "有付出就有收穫，這週的努力會在之後體現！💪"
    else:
        mood = "support"
        overall = "下週再加油！重要的是不要放棄。🌟"
    
    return {
        "summary": summary_points,
        "overall": overall,
        "mood": mood,
        "stats": stats
    }
