import asyncio
from prisma import Prisma
from datetime import datetime, timedelta
import random

async def main():
    db = Prisma()
    await db.connect()
    
    print("🌱 Cleaning up old data...")
    # Delete in order of dependencies (Child -> Parent)
    await db.flashcardreview.delete_many()
    await db.flashcard.delete_many()
    await db.studysession.delete_many()
    await db.conceptrelation.delete_many()
    await db.concept.delete_many()
    await db.task.delete_many()
    await db.studyplan.delete_many()
    await db.chapter.delete_many()
    await db.exam.delete_many()
    await db.textbook.delete_many()
    await db.tag.delete_many()
    await db.userwellbeing.delete_many()
    await db.semesterconfig.delete_many()
    await db.usermemory.delete_many()
    await db.subject.delete_many()
    await db.user.delete_many()

    print("👤 Creating User...")
    user = await db.user.create(
        data={
            "email": "ken@example.com",
            "name": "Ken",
            "provider": "email",
             # Note: Settings is not in User model directly in schema provided, assuming removed or handled differently.
             # Checking User model: sessions, subjects, flashcards, tasks, semesterConfig, memory, wellbeingLog.
             # No 'settings' JSON field.
        }
    )

    print("📚 Creating Subjects...")
    subjects_data = [
        {"name": "微積分 (Calculus)", "color": "#3B82F6"}, # Blue
        {"name": "線性代數 (Linear Algebra)", "color": "#8B5CF6"}, # Purple
        {"name": "認知科學 (Cognitive Sci)", "color": "#10B981"}, # Green
        {"name": "英文 (English)", "color": "#F59E0B"}, # Amber
    ]
    
    subjects = {}
    for sub in subjects_data:
        record = await db.subject.create(
            data={
                "name": sub["name"],
                "color": sub["color"],
                "userId": user.id
            }
        )
        subjects[sub["name"]] = record

    print("🧠 Creating Concepts (Knowledge Graph)...")
    # Calculus Concepts
    # Schema has 'name', no 'term'. 'subjectId' is Int.
    c_limits = await db.concept.create(data={"name": "Limits", "description": "Foundational concept of calculus", "subjectId": subjects["微積分 (Calculus)"].id})
    c_derivatives = await db.concept.create(data={"name": "Derivatives", "description": "Rate of change", "subjectId": subjects["微積分 (Calculus)"].id})
    c_integrals = await db.concept.create(data={"name": "Integrals", "description": "Area under curve", "subjectId": subjects["微積分 (Calculus)"].id})
    c_chain_rule = await db.concept.create(data={"name": "Chain Rule", "description": "Derivative of composite functions", "subjectId": subjects["微積分 (Calculus)"].id})
    
    await db.conceptrelation.create(data={"sourceId": c_limits.id, "targetId": c_derivatives.id, "type": "PREREQUISITE", "strength": 0.9})
    await db.conceptrelation.create(data={"sourceId": c_derivatives.id, "targetId": c_integrals.id, "type": "RELATED", "strength": 0.5})
    await db.conceptrelation.create(data={"sourceId": c_derivatives.id, "targetId": c_chain_rule.id, "type": "PART_OF", "strength": 0.95})

    # Cognitive Science Concepts
    c_neuro = await db.concept.create(data={"name": "Neuroplasticity", "description": "Brain's ability to reorganize", "subjectId": subjects["認知科學 (Cognitive Sci)"].id})
    c_fsrs = await db.concept.create(data={"name": "FSRS", "description": "Free Spaced Repetition Scheduler", "subjectId": subjects["認知科學 (Cognitive Sci)"].id})
    c_meta = await db.concept.create(data={"name": "Metacognition", "description": "Thinking about thinking", "subjectId": subjects["認知科學 (Cognitive Sci)"].id})

    await db.conceptrelation.create(data={"sourceId": c_neuro.id, "targetId": c_fsrs.id, "type": "CAUSES", "strength": 0.8})

    print("⚡️ Creating Flashcards...")
    # Calculus cards
    await db.flashcard.create(data={
        "front": "Product Rule definition?", "back": "(fg)' = f'g + fg'", 
        "userId": user.id, "subjectId": subjects["微積分 (Calculus)"].id,
        "difficulty": 3.0, "stability": 4.5, "due": datetime.utcnow() + timedelta(days=1)
    })
    await db.flashcard.create(data={
        "front": "Integral of 1/x?", "back": "ln|x| + C", 
        "userId": user.id, "subjectId": subjects["微積分 (Calculus)"].id,
        "difficulty": 2.0, "stability": 10.0, "due": datetime.utcnow() + timedelta(days=5)
    })
    # Algebra cards
    await db.flashcard.create(data={
        "front": "Eigenvalue equation?", "back": "Ax = λx", 
        "userId": user.id, "subjectId": subjects["線性代數 (Linear Algebra)"].id,
        "difficulty": 6.0, "stability": 1.2, "due": datetime.utcnow() - timedelta(hours=2) # Overdue
    })
    # Create Tasks
    await db.task.create(data={
        "title": "Review Linear Algebra Chapter 1",
        "description": "Focus on vector spaces",
        "priority": 3,
        "subjectId": subjects["線性代數 (Linear Algebra)"].id,
        "userId": user.id,
        "dueDate": datetime.utcnow() + timedelta(days=2)
    })

    print("📅 Creating Study Sessions (History)...")
    # Create sessions for the past week
    for i in range(7):
        day = datetime.utcnow() - timedelta(days=i)
        if i == 2: continue # Skip one day to break streak for fun
        
        await db.studysession.create(data={
            "userId": user.id,
            "subjectId": subjects["微積分 (Calculus)"].id if i % 2 == 0 else subjects["認知科學 (Cognitive Sci)"].id,
            "startTime": day,
            "endTime": day + timedelta(minutes=random.randint(25, 60)),
            "duration": random.randint(25, 60),
            # "focusScore": random.randint(70, 95), # Not in schema provided earlier? Checking schema: duration, plannedDuration, isFocusMode, interruptions, cognitiveLoad, fatigueLevel, notes. No 'focusScore'.
            # Note: I added focusScore in previous thought but schema says:
            # model StudySession { ... cognitiveLoad String ... fatigueLevel Int? ... notes String? ... }
            # Wait, user context might have old schema in head? No, I viewed the file. Use file content.
            # Schema line 57: duration, plannedDuration, isFocusMode, interruptions, cognitiveLoad, fatigueLevel.
            "cognitiveLoad": "MEDIUM",
            "fatigueLevel": random.randint(2, 6)
        })

    print("🔋 Creating Wellbeing Logs (Brain State)...")
    today = datetime.utcnow()
    # Good sleep yesterday
    await db.userwellbeing.create(data={
        "userId": user.id,
        "date": today - timedelta(days=1),
        "sleepHours": 7.5,
        "sleepQuality": 8,
        "stressLevel": 3,
        "mood": "neutral",
        "energyLevel": 7
    })
    # A bit tired today
    await db.userwellbeing.create(data={
        "userId": user.id,
        "date": today,
        "sleepHours": 6.0,
        "sleepQuality": 6,
        "stressLevel": 6, 
        "mood": "anxious",
        "energyLevel": 5 # Should trigger "Medium" fatigue
    })

    await db.disconnect()
    print("✅ Seed completed! Database populated with mock data.")

if __name__ == '__main__':
    asyncio.run(main())
