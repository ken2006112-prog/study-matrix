from app.db import db
from app.services.chat import chat_service
from datetime import datetime, timedelta
from typing import Optional

class ReportService:
    async def generate_weekly_report(self, user_id: int) -> dict:
        """生成完整的每週學習分析報告，包含 AI 建議"""
        
        today = datetime.now()
        seven_days_ago = today - timedelta(days=7)
        
        # 1. 獲取學習數據
        sessions = await db.studysession.find_many(
            where={
                'userId': user_id,
                'startTime': {'gte': seven_days_ago}
            },
            include={'subject': True}
        )
        
        # 2. 獲取複習數據
        flashcards = await db.flashcard.find_many(
            where={
                'userId': user_id,
                'lastReview': {'gte': seven_days_ago}
            }
        )
        
        # 3. 計算統計
        stats = self._calculate_stats(sessions, flashcards)
        
        # 4. 生成 AI 分析和建議
        analysis = await self._generate_ai_analysis(stats)
        
        # 5. 獲取最新學習科學研究建議
        research_tips = await self._get_research_based_tips(stats)
        
        return {
            "period": {
                "start": seven_days_ago.isoformat(),
                "end": today.isoformat()
            },
            "stats": stats,
            "analysis": analysis,
            "research_tips": research_tips,
            "weekly_score": self._calculate_weekly_score(stats),
            "generated_at": today.isoformat()
        }
    
    def _calculate_stats(self, sessions, flashcards) -> dict:
        """計算學習統計數據"""
        total_duration = sum([s.duration for s in sessions if s.duration]) or 0
        total_planned = sum([s.plannedDuration for s in sessions if s.plannedDuration]) or 0
        
        # 時間誠實度
        honesty_ratio = (total_duration / total_planned * 100) if total_planned > 0 else 0
        
        # 科目分佈
        subjects = {}
        for s in sessions:
            if s.subject:
                subjects[s.subject.name] = subjects.get(s.subject.name, 0) + (s.duration or 0)
        
        # 複習效率
        if flashcards:
            successful = sum(1 for card in flashcards if card.reps > card.lapses)
            review_success_rate = (successful / len(flashcards)) * 100
        else:
            review_success_rate = 0
        
        # 專注度 (基於中斷次數)
        total_interruptions = sum([s.interruptions for s in sessions])
        focus_score = max(0, 100 - (total_interruptions * 5))
        
        # 連續學習天數
        study_days = set()
        for s in sessions:
            study_days.add(s.startTime.date())
        streak = len(study_days)
        
        return {
            "total_study_hours": round(total_duration / 60, 1),
            "total_sessions": len(sessions),
            "honesty_ratio": round(honesty_ratio, 1),
            "subject_distribution": subjects,
            "review_success_rate": round(review_success_rate, 1),
            "cards_reviewed": len(flashcards),
            "focus_score": focus_score,
            "study_streak": streak,
            "avg_session_duration": round(total_duration / len(sessions), 1) if sessions else 0,
            "interruptions_count": total_interruptions
        }
    
    def _calculate_weekly_score(self, stats: dict) -> int:
        """計算綜合週評分 (0-100)"""
        weights = {
            "study_time": 0.25,  # 學習時長
            "honesty": 0.20,     # 時間誠實度
            "review": 0.20,      # 複習成功率
            "focus": 0.20,       # 專注度
            "streak": 0.15       # 學習連續性
        }
        
        # Normalize scores to 0-100
        study_time_score = min(100, stats["total_study_hours"] * 10)  # 10h = 100分
        honesty_score = min(100, stats["honesty_ratio"])
        review_score = stats["review_success_rate"]
        focus_score = stats["focus_score"]
        streak_score = min(100, stats["study_streak"] * 15)  # 7天 = 105分
        
        total = (
            study_time_score * weights["study_time"] +
            honesty_score * weights["honesty"] +
            review_score * weights["review"] +
            focus_score * weights["focus"] +
            streak_score * weights["streak"]
        )
        
        return round(total)
    
    async def _generate_ai_analysis(self, stats: dict) -> dict:
        """使用 AI 生成個性化分析"""
        
        prompt = f"""
        分析這位學生的週學習數據：
        
        - 總學習時間: {stats['total_study_hours']} 小時
        - 學習天數: {stats['study_streak']}/7 天
        - 時間誠實度: {stats['honesty_ratio']}%
        - 複習成功率: {stats['review_success_rate']}%
        - 專注度評分: {stats['focus_score']}/100
        - 中斷次數: {stats['interruptions_count']}
        - 科目分佈: {stats['subject_distribution']}
        
        請提供：
        1. **整體評價** (1-2句話)
        2. **優勢** (做得好的地方)
        3. **待改進** (需要加強的地方)  
        4. **下週目標** (1個具體可執行的建議)
        
        用繁體中文回答，語氣友善鼓勵。
        """
        
        try:
            response = await chat_service.generate_completion(
                prompt,
                system_prompt="你是認知科學學習教練，專注於基於證據的學習策略。"
            )
            
            return {
                "markdown": response,
                "generated": True
            }
        except Exception as e:
            return {
                "markdown": self._fallback_analysis(stats),
                "generated": False,
                "error": str(e)
            }
    
    def _fallback_analysis(self, stats: dict) -> str:
        """當 AI 不可用時的備用分析"""
        score = self._calculate_weekly_score(stats)
        
        if score >= 80:
            grade = "🌟 優秀"
            comment = "維持這個節奏，你做得很好！"
        elif score >= 60:
            grade = "👍 良好"
            comment = "有進步空間，繼續加油！"
        else:
            grade = "💪 需努力"
            comment = "讓我們制定一個更好的計畫吧！"
        
        return f"""
## 週學習報告

**{grade}** - 綜合評分: {score}/100

{comment}

### 統計數據
- 學習時間: {stats['total_study_hours']} 小時
- 複習成功率: {stats['review_success_rate']}%
- 專注度: {stats['focus_score']}/100

### 下週建議
嘗試使用番茄工作法來提升專注度！
"""
    
    async def _get_research_based_tips(self, stats: dict) -> list:
        """基於最新學習科學研究的建議"""
        tips = []
        
        # 基於間隔重複理論
        if stats["cards_reviewed"] < 10:
            tips.append({
                "title": "間隔重複效應",
                "source": "Ebbinghaus, H. (1885)",
                "insight": "每天複習 10-20 張閃卡可以顯著提升長期記憶",
                "action": "設定每日閃卡複習提醒"
            })
        
        # 基於專注力研究
        if stats["focus_score"] < 70:
            tips.append({
                "title": "注意力恢復理論",
                "source": "Kaplan & Kaplan (1989)",
                "insight": "短暫休息可以恢復注意力，20-20-20法則有效",
                "action": "每 25 分鐘休息 5 分鐘"
            })
        
        # 基於時間管理研究
        if stats["honesty_ratio"] < 80:
            tips.append({
                "title": "計畫謬誤",
                "source": "Kahneman & Tversky (1979)",
                "insight": "人們傾向低估任務時間，建議預留 20% 緩衝",
                "action": "下次規劃時多加 20% 時間"
            })
        
        # 基於學習分散理論
        if stats["study_streak"] < 5:
            tips.append({
                "title": "分散練習效應",
                "source": "Cepeda et al. (2006)",
                "insight": "每天少量學習比一次大量學習更有效",
                "action": "設定每日固定學習時段"
            })
        
        # 基於交錯學習
        if len(stats["subject_distribution"]) == 1:
            tips.append({
                "title": "交錯學習效應",
                "source": "Rohrer & Taylor (2007)",
                "insight": "混合學習不同科目可增強問題解決能力",
                "action": "嘗試在一次學習中涵蓋 2-3 個科目"
            })
        
        return tips[:3]  # 最多返回 3 個建議


report_service = ReportService()
