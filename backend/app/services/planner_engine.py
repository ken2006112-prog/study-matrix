from datetime import datetime, timedelta
from typing import List, Dict
from app.db import db
import math

class PlannerEngine:
    async def generate_initial_plan(self, user_id: int):
        """
        Generates a semester study plan based on Exams and Subjects.
        Algorithm: Backward Planning from Exam Dates.
        """
        print(f"Generating plan for User {user_id}...")
        
        # 1. Fetch Context
        semester = await db.semesterconfig.find_unique(
            where={'userId': user_id},
            include={'subjects': True}
        )
        
        if not semester:
            # Auto-create a default semester config
            print(f"No semester found for User {user_id}, creating default...")
            semester = await db.semesterconfig.create(data={
                'userId': user_id,
                'semesterName': 'Default Semester',
                'startDate': datetime.now(),
                'endDate': datetime.now() + timedelta(days=120),
                'weeklyStudyHours': 20,
                'learningStyle': 'balanced'
            })
            # Fetch again with subjects included (will be empty)
            semester = await db.semesterconfig.find_unique(
                where={'userId': user_id},
                include={'subjects': True}
            )
              
        subjects = semester.subjects if semester.subjects else []
        
        if not subjects:
            # Return helpful message instead of error
            return {
                "status": "no_subjects",
                "message": "請先在 /setup 頁面設定科目和考試日期！",
                "redirect": "/setup"
            }
            
        exams = await db.exam.find_many(
            where={'subjectId': {'in': [s.id for s in subjects]}},
            include={'subject': True}
        )
        
        if not exams:
            return {
                "status": "no_exams", 
                "message": "請先設定考試日期！系統需要考試日期來產生學習計畫。",
                "redirect": "/setup"
            }
        
        # 2. Strategy: Allocate Weekly Hours per Subject
        # Logic: Priority (1-3) * Difficulty (1-10) = Weight
        total_weight = 0
        subject_weights = {}
        
        for sub in subjects:
            weight = sub.priority * sub.difficulty
            subject_weights[sub.id] = weight
            total_weight += weight
            
        if total_weight == 0: total_weight = 1
        
        # Calculate hours per subject
        weekly_hours_budget = semester.weeklyStudyHours
        subject_hours = {}
        for sub in subjects:
            share = subject_weights[sub.id] / total_weight
            hours = round(share * weekly_hours_budget, 1)
            subject_hours[sub.id] = hours
            
        print(f"Weekly Allocation: {subject_hours}")

        # 3. Create Study Plans (Milestones) for Exams
        # We will create weekly milestones leading up to each exam.
        
        current_date = datetime.now()
        
        for exam in exams:
            # Days until exam
            days_until = (exam.examDate - current_date).days
            if days_until <= 0: continue
            
            weeks_until = math.ceil(days_until / 7)
            sub_id = exam.subjectId
            weekly_h = subject_hours.get(sub_id, 2)
            
            print(f"Planning for {exam.subject.name} ({exam.examType}): {weeks_until} weeks out.")
            
            # Generate Weekly Milestones (Backward)
            for w in range(weeks_until):
                week_num = weeks_until - w # 1 is closest to exam (Review week)
                
                # Calculate Dates for this week slot
                # Start from exam date and go back
                week_end_date = exam.examDate - timedelta(days=w*7)
                week_start_date = week_end_date - timedelta(days=6)
                
                # Determine Phase
                phase = "Foundation"
                focus = "Reading & Concepts"
                if week_num <= 2:
                    phase = "Review"
                    focus = "Past Papers & Mock Exams"
                elif week_num <= 5:
                    phase = "Practice"
                    focus = "Flashcards & Problem Solving"
                    
                # Create Task Description
                task_desc = f"Week {week_num} Prep: {focus}"
                
                # Save to DB (StudyPlan Table)
                await db.studyplan.create(data={
                    'examId': exam.id,
                    'weekNumber': week_num,
                    'weekStart': week_start_date,
                    'weekEnd': week_end_date,
                    'totalHours': weekly_h,
                    'priority': "core" if exam.weight > 20 else "support",
                    'tasks': f'["{task_desc}"]', 
                    'chaptersToStudy': "[]" # Placeholder
                })
                
                # Create Concrete Daily Tasks (Just one per week for now to avoid clutter)
                # In real app, we distribute this `weekly_h` across days
                await db.task.create(data={
                    'title': f"[{exam.subject.name}] {phase}: {focus}",
                    'description': f"Target: {weekly_h} hours this week. Focus on {focus}.",
                    'dueDate': week_end_date,
                    'priority': 3 if week_num <= 2 else 2,
                    'subjectId': sub_id,
                    'userId': user_id,
                    'isCompleted': False
                })

        return {"status": "success", "message": "Plan generated"}

planner_engine = PlannerEngine()
