from app.db import db
from app.services.chat import chat_service
from datetime import datetime, timedelta

class ReportService:
    async def generate_weekly_report(self, user_id: int) -> str:
        # 1. Fetch data for last 7 days
        today = datetime.now()
        seven_days_ago = today - timedelta(days=7)
        
        sessions = await db.studysession.find_many(
            where={
                'userId': user_id,
                'startTime': {'gte': seven_days_ago}
            },
            include={'subject': True}
        )
        
        # 2. Aggregate Stats
        total_duration = sum([s.duration for s in sessions if s.duration])
        total_planned = sum([s.plannedDuration for s in sessions if s.plannedDuration])
        
        honesty_ratio = 0
        if total_planned > 0:
            honesty_ratio = (sum([s.duration for s in sessions if s.duration and s.plannedDuration]) or 0) / total_planned

        subjects = {}
        for s in sessions:
            if s.subject:
                subjects[s.subject.name] = subjects.get(s.subject.name, 0) + (s.duration or 0)

        # 3. Construct Prompt
        prompt = f"""
        Analyze this student's study data for the past week:
        - Total Study Time: {round(total_duration / 60, 1)} hours
        - Time Honesty (Actual/Planned): {round(honesty_ratio * 100)}%
        - Subject Distribution: {subjects}
        
        Please provide a 'Weekly Adaptive Report' in Markdown.
        Include:
        1. **Executive Summary**: 1-2 sentences on their performance.
        2. **Time Honesty Analysis**: Are they realistic with their planning?
        3. **Subject Balance**: Are they neglecting anything?
        4. **Next Week's Goal**: 1 concrete, actionable advice.
        
        Adopt a supportive but analytical 'Cognitive Coach' persona.
        """
        
        # 4. Call AI
        response = await chat_service.generate_completion(
            prompt, 
            system_prompt="You are EduMate, an expert cognitive science study coach."
        )
        
        return response

report_service = ReportService()
