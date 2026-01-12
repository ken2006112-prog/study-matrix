from app.db import db
from datetime import datetime, timedelta
from typing import List, Dict, Any

class AdaptivePlanner:
    """
    Module 3: Adaptive Replanning Service
    Detects schedule deviation and redistributes tasks automatically.
    """
    
    DEVIATION_THRESHOLD = 0.20  # 20% behind triggers replanning
    
    async def check_deviation(self, user_id: int) -> Dict[str, Any]:
        """
        Calculate how far behind the user is from their planned schedule.
        Returns deviation score and recommendation.
        """
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        
        # Get study plans for the past week
        plans = await db.studyplan.find_many(
            where={
                "userId": user_id,
                "weekStart": {"gte": week_ago}
            }
        )
        
        # Get completed study sessions for the past week
        sessions = await db.studysession.find_many(
            where={
                "userId": user_id,
                "createdAt": {"gte": week_ago}
            }
        )
        
        # Calculate planned hours (from StudyPlan)
        planned_hours = sum(p.targetHours or 0 for p in plans)
        
        # Calculate actual hours (from StudySessions)
        actual_minutes = sum(s.actualDuration or 0 for s in sessions)
        actual_hours = actual_minutes / 60
        
        if planned_hours == 0:
            return {
                "deviation": 0,
                "status": "no_plan",
                "message": "No study plan found for this week."
            }
        
        deviation = (planned_hours - actual_hours) / planned_hours
        
        status = "on_track"
        if deviation > self.DEVIATION_THRESHOLD:
            status = "behind"
        elif deviation < -0.1:
            status = "ahead"
        
        return {
            "deviation": round(deviation, 2),
            "plannedHours": round(planned_hours, 1),
            "actualHours": round(actual_hours, 1),
            "status": status,
            "message": self._get_message(status, deviation)
        }
    
    def _get_message(self, status: str, deviation: float) -> str:
        if status == "behind":
            return f"You're {int(deviation * 100)}% behind schedule. Consider replanning."
        elif status == "ahead":
            return "Great job! You're ahead of schedule."
        else:
            return "You're on track with your study plan."
    
    async def trigger_replan(self, user_id: int) -> Dict[str, Any]:
        """
        Redistribute remaining tasks based on time until exams.
        """
        now = datetime.now()
        
        # Get upcoming exams
        exams = await db.exam.find_many(
            where={
                "subject": {"userId": user_id},
                "date": {"gte": now}
            },
            include={"subject": True},
            order={"date": "asc"}
        )
        
        if not exams:
            return {"success": False, "message": "No upcoming exams found."}
        
        # Get incomplete tasks
        tasks = await db.task.find_many(
            where={
                "userId": user_id,
                "status": {"not": "completed"},
                "dueDate": {"gte": now}
            },
            include={"subject": True}
        )
        
        if not tasks:
            return {"success": False, "message": "No pending tasks to replan."}
        
        # Get semester config for weekly hours
        semester = await db.semesterconfig.find_first(
            where={"userId": user_id},
            order={"id": "desc"}
        )
        weekly_hours = semester.weeklyStudyHours if semester else 20
        
        # Calculate days until each exam
        exam_urgency = {}
        for exam in exams:
            days_left = (exam.date - now).days
            if days_left <= 0:
                days_left = 1
            urgency = 1 / days_left  # Higher urgency for closer exams
            exam_urgency[exam.subjectId] = urgency
        
        # Redistribute tasks
        redistributed = []
        current_date = now
        daily_hours = weekly_hours / 7
        
        # Sort tasks by subject urgency
        sorted_tasks = sorted(
            tasks,
            key=lambda t: exam_urgency.get(t.subjectId, 0),
            reverse=True
        )
        
        for task in sorted_tasks:
            urgency = exam_urgency.get(task.subjectId, 0.5)
            
            # Push high-urgency tasks earlier
            if urgency > 0.5:
                new_due = current_date + timedelta(days=1)
            else:
                new_due = current_date + timedelta(days=3)
            
            # Update task in database
            await db.task.update(
                where={"id": task.id},
                data={
                    "dueDate": new_due,
                    "description": f"[Replanned] {task.description or ''}"
                }
            )
            
            redistributed.append({
                "taskId": task.id,
                "title": task.title,
                "newDueDate": new_due.isoformat(),
                "subject": task.subject.name if task.subject else None
            })
            
            current_date = new_due
        
        # Log replanning event
        print(f"[AdaptivePlanner] Replanned {len(redistributed)} tasks for user {user_id}")
        
        return {
            "success": True,
            "message": f"Successfully replanned {len(redistributed)} tasks.",
            "redistributed": redistributed
        }

adaptive_planner = AdaptivePlanner()
