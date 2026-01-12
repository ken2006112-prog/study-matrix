"""
AI Study Coach Service
Analyzes ALL system data and provides personalized recommendations
"""
from app.db import db
from app.services.chat import chat_service
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json

class AICoachService:
    """
    智能學習教練 - 分析所有系統數據並提供個性化建議
    
    Data Sources:
    - Study Sessions: 學習時間、專注度、中斷
    - Flashcards: 複習效率、遺忘曲線
    - Tasks: 完成率、拖延模式
    - Exams: 考試日程、準備狀態
    - Calendar: 時間分配
    """
    
    async def get_comprehensive_analysis(self, user_id: int) -> Dict[str, Any]:
        """聚合所有數據並生成全面分析"""
        
        # 1. 收集所有數據
        data = await self._collect_all_data(user_id)
        
        # 2. 計算各維度指標
        metrics = self._calculate_metrics(data)
        
        # 3. 識別問題和機會
        insights = self._identify_insights(data, metrics)
        
        # 4. 生成 AI 建議
        ai_recommendations = await self._generate_ai_recommendations(data, metrics, insights)
        
        # 5. 構建行動項目
        action_items = self._build_action_items(insights, ai_recommendations)
        
        return {
            "overview": {
                "health_score": metrics["overall_score"],
                "trend": metrics["trend"],
                "streak": data["streak_days"]
            },
            "metrics": metrics,
            "insights": insights,
            "recommendations": ai_recommendations,
            "action_items": action_items,
            "generated_at": datetime.now().isoformat()
        }
    
    async def _collect_all_data(self, user_id: int) -> Dict[str, Any]:
        """收集用戶所有相關數據"""
        
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # 學習時段
        sessions = await db.studysession.find_many(
            where={"userId": user_id, "startTime": {"gte": month_ago}},
            include={"subject": True}
        )
        
        # 閃卡
        flashcards = await db.flashcard.find_many(
            where={"userId": user_id},
            include={"subject": True}
        )
        
        # 任務
        tasks = await db.task.find_many(
            where={"userId": user_id},
            include={"subject": True}
        )
        
        # 考試
        exams = await db.exam.find_many(
            where={"subjectId": {"in": [s.id for s in await db.subject.find_many(where={"userId": user_id})]}},
            include={"subject": True}
        )
        
        # 科目
        subjects = await db.subject.find_many(where={"userId": user_id})
        
        # 用戶記憶
        memory = await db.usermemory.find_unique(where={"userId": user_id})
        
        # 計算連續學習天數
        study_days = set()
        for s in sessions:
            study_days.add(s.startTime.date())
        
        streak = 0
        check_date = now.date()
        while check_date in study_days:
            streak += 1
            check_date -= timedelta(days=1)
        
        return {
            "sessions": sessions,
            "flashcards": flashcards,
            "tasks": tasks,
            "exams": exams,
            "subjects": subjects,
            "memory": memory,
            "streak_days": streak,
            "week_ago": week_ago,
            "now": now
        }
    
    def _calculate_metrics(self, data: Dict) -> Dict[str, Any]:
        """計算各維度指標"""
        
        sessions = data["sessions"]
        flashcards = data["flashcards"]
        tasks = data["tasks"]
        exams = data["exams"]
        week_ago = data["week_ago"]
        
        # 本週學習時間
        week_sessions = [s for s in sessions if s.startTime >= week_ago]
        total_study_minutes = sum(s.duration or 0 for s in week_sessions)
        total_planned = sum(s.plannedDuration or 0 for s in week_sessions)
        
        # 時間誠實度
        honesty = (total_study_minutes / total_planned * 100) if total_planned > 0 else 100
        
        # 專注度 (基於中斷)
        total_interruptions = sum(s.interruptions for s in week_sessions)
        focus_score = max(0, 100 - (total_interruptions * 3))
        
        # 閃卡效率
        due_cards = len([c for c in flashcards if c.due and c.due <= data["now"]])
        reviewed_cards = len([c for c in flashcards if c.lastReview and c.lastReview >= week_ago])
        card_success_rate = sum(1 for c in flashcards if c.reps > c.lapses) / max(1, len(flashcards)) * 100
        
        # 任務完成率
        pending_tasks = [t for t in tasks if not t.isCompleted]
        completed_tasks = [t for t in tasks if t.isCompleted]
        task_completion_rate = len(completed_tasks) / max(1, len(tasks)) * 100
        
        # 過期任務
        overdue_tasks = [t for t in pending_tasks if t.dueDate and t.dueDate < data["now"]]
        
        # 即將到來的考試
        upcoming_exams = [e for e in exams if e.examDate > data["now"]]
        urgent_exams = [e for e in upcoming_exams if (e.examDate - data["now"]).days <= 7]
        
        # 科目平衡度
        subject_hours = {}
        for s in sessions:
            if s.subject:
                subject_hours[s.subject.name] = subject_hours.get(s.subject.name, 0) + (s.duration or 0)
        
        # 計算平衡指數 (標準差的反向)
        if len(subject_hours) > 1:
            values = list(subject_hours.values())
            mean = sum(values) / len(values)
            variance = sum((x - mean) ** 2 for x in values) / len(values)
            balance_score = max(0, 100 - (variance ** 0.5) / mean * 50) if mean > 0 else 50
        else:
            balance_score = 50
        
        # 綜合評分
        overall_score = (
            (total_study_minutes / 60 / 10) * 20 +  # 學習時間 (10h = 20分)
            honesty * 0.15 +
            focus_score * 0.2 +
            card_success_rate * 0.15 +
            task_completion_rate * 0.15 +
            balance_score * 0.15
        )
        overall_score = min(100, max(0, overall_score))
        
        # 趨勢計算 (對比上週)
        prev_week_start = week_ago - timedelta(days=7)
        prev_sessions = [s for s in sessions if prev_week_start <= s.startTime < week_ago]
        prev_minutes = sum(s.duration or 0 for s in prev_sessions)
        
        if prev_minutes > 0:
            trend = ((total_study_minutes - prev_minutes) / prev_minutes) * 100
        else:
            trend = 100 if total_study_minutes > 0 else 0
        
        return {
            "overall_score": round(overall_score),
            "trend": round(trend),
            "study_hours_this_week": round(total_study_minutes / 60, 1),
            "honesty_ratio": round(honesty),
            "focus_score": round(focus_score),
            "card_success_rate": round(card_success_rate),
            "due_cards": due_cards,
            "reviewed_cards": reviewed_cards,
            "task_completion_rate": round(task_completion_rate),
            "pending_tasks": len(pending_tasks),
            "overdue_tasks": len(overdue_tasks),
            "upcoming_exams": len(upcoming_exams),
            "urgent_exams": len(urgent_exams),
            "balance_score": round(balance_score),
            "subject_distribution": subject_hours
        }
    
    def _identify_insights(self, data: Dict, metrics: Dict) -> List[Dict]:
        """識別問題和機會"""
        
        insights = []
        
        # 閃卡堆積
        if metrics["due_cards"] > 20:
            insights.append({
                "type": "warning",
                "category": "flashcards",
                "title": "閃卡堆積嚴重",
                "description": f"有 {metrics['due_cards']} 張閃卡待複習，遺忘曲線正在惡化",
                "priority": "high"
            })
        
        # 任務過期
        if metrics["overdue_tasks"] > 0:
            insights.append({
                "type": "warning",
                "category": "tasks",
                "title": "有過期任務",
                "description": f"{metrics['overdue_tasks']} 個任務已過期，需要立即處理或重新安排",
                "priority": "high"
            })
        
        # 考試緊迫
        if metrics["urgent_exams"] > 0:
            insights.append({
                "type": "alert",
                "category": "exams",
                "title": "考試將至",
                "description": f"{metrics['urgent_exams']} 個考試在一週內，請確認準備狀態",
                "priority": "critical"
            })
        
        # 專注度問題
        if metrics["focus_score"] < 60:
            insights.append({
                "type": "suggestion",
                "category": "focus",
                "title": "專注度待提升",
                "description": "學習中斷頻繁，建議使用番茄工作法",
                "priority": "medium"
            })
        
        # 時間管理
        if metrics["honesty_ratio"] < 70:
            insights.append({
                "type": "suggestion",
                "category": "planning",
                "title": "計劃準確度不足",
                "description": "實際學習時間與計劃差距大，建議調整預估",
                "priority": "medium"
            })
        
        # 科目失衡
        if metrics["balance_score"] < 50:
            insights.append({
                "type": "warning",
                "category": "balance",
                "title": "科目分配不均",
                "description": "某些科目被忽視，可能影響整體成績",
                "priority": "medium"
            })
        
        # 正面反饋
        if data["streak_days"] >= 7:
            insights.append({
                "type": "achievement",
                "category": "streak",
                "title": f"連續學習 {data['streak_days']} 天！",
                "description": "習慣養成中，繼續保持！",
                "priority": "positive"
            })
        
        if metrics["card_success_rate"] > 80:
            insights.append({
                "type": "achievement",
                "category": "flashcards",
                "title": "閃卡掌握度優秀",
                "description": f"成功率 {metrics['card_success_rate']}%，記憶效果良好",
                "priority": "positive"
            })
        
        return insights
    
    async def _generate_ai_recommendations(self, data: Dict, metrics: Dict, insights: List) -> str:
        """使用 AI 生成個性化建議"""
        
        prompt = f"""
        基於以下學生的學習數據，提供 3-5 條具體、可執行的建議：
        
        ## 本週概況
        - 學習時數: {metrics['study_hours_this_week']} 小時
        - 連續學習: {data['streak_days']} 天
        - 綜合評分: {metrics['overall_score']}/100
        - 趨勢: {"上升" if metrics['trend'] > 0 else "下降"} {abs(metrics['trend'])}%
        
        ## 各維度指標
        - 時間誠實度: {metrics['honesty_ratio']}%
        - 專注度: {metrics['focus_score']}/100
        - 閃卡成功率: {metrics['card_success_rate']}%
        - 任務完成率: {metrics['task_completion_rate']}%
        - 科目平衡: {metrics['balance_score']}/100
        
        ## 待處理事項
        - 待複習閃卡: {metrics['due_cards']} 張
        - 待完成任務: {metrics['pending_tasks']} 個
        - 過期任務: {metrics['overdue_tasks']} 個
        - 即將考試: {metrics['upcoming_exams']} 個（其中 {metrics['urgent_exams']} 個在一週內）
        
        ## 科目分佈
        {json.dumps(metrics['subject_distribution'], ensure_ascii=False)}
        
        ## 已識別問題
        {json.dumps([i for i in insights if i['type'] in ['warning', 'alert']], ensure_ascii=False)}
        
        請用繁體中文回答，格式：
        1. **建議標題**: 具體行動描述
        
        語氣要友善、鼓勵，但也要實際有用。
        """
        
        try:
            response = await chat_service.generate_completion(
                prompt,
                system_prompt="你是智能學習教練 EduMate，專注於基於認知科學的個性化學習策略。你了解二八法則、間隔重複、主動回憶等學習方法。"
            )
            return response
        except Exception as e:
            return self._fallback_recommendations(metrics, insights)
    
    def _fallback_recommendations(self, metrics: Dict, insights: List) -> str:
        """AI 不可用時的備用建議"""
        
        recs = []
        
        if metrics["due_cards"] > 10:
            recs.append("1. **清理閃卡積壓**: 花 15 分鐘先複習最緊急的 20 張閃卡")
        
        if metrics["overdue_tasks"] > 0:
            recs.append("2. **處理過期任務**: 逐一檢視過期任務，刪除或重新安排")
        
        if metrics["focus_score"] < 70:
            recs.append("3. **提升專注力**: 嘗試 25 分鐘專注 + 5 分鐘休息的番茄工作法")
        
        if metrics["balance_score"] < 60:
            recs.append("4. **平衡科目**: 給被忽視的科目安排一次 30 分鐘的複習")
        
        if not recs:
            recs.append("1. **保持節奏**: 你的學習狀態良好，繼續保持每日學習習慣")
            recs.append("2. **提前複習**: 為即將到來的考試提早準備")
        
        return "\n".join(recs)
    
    def _build_action_items(self, insights: List, ai_recs: str) -> List[Dict]:
        """構建具體行動項目"""
        
        actions = []
        
        # 基於 insights 生成行動
        for insight in insights:
            if insight["priority"] == "critical":
                actions.append({
                    "title": insight["title"],
                    "urgency": "now",
                    "estimated_time": "10-30 分鐘",
                    "link": self._get_link_for_category(insight["category"])
                })
            elif insight["priority"] == "high":
                actions.append({
                    "title": insight["title"],
                    "urgency": "today",
                    "estimated_time": "15-30 分鐘",
                    "link": self._get_link_for_category(insight["category"])
                })
        
        return actions[:5]  # 最多 5 個行動項目
    
    def _get_link_for_category(self, category: str) -> str:
        links = {
            "flashcards": "/flashcards",
            "tasks": "/matrix",
            "exams": "/calendar",
            "focus": "/dashboard",
            "planning": "/planner",
            "balance": "/subjects"
        }
        return links.get(category, "/dashboard")


ai_coach_service = AICoachService()
