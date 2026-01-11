"""
Demo Data Seeder
Populates the database with realistic demo data for testing
"""

import asyncio
from datetime import datetime, timedelta
import random
from app.db import db

# Demo Subjects
SUBJECTS = [
    {"name": "微積分", "color": "#3B82F6"},
    {"name": "線性代數", "color": "#8B5CF6"},
    {"name": "普通物理", "color": "#10B981"},
    {"name": "程式設計", "color": "#F59E0B"},
    {"name": "英文", "color": "#EF4444"},
]

# Demo Tasks
TASK_TEMPLATES = [
    ("閱讀: {subject} 第{chapter}章", 30),
    ("複習: {subject} 重點概念", 20),
    ("練習: {subject} 習題", 45),
    ("主動回憶: {subject} 核心公式", 15),
    ("整理: {subject} 筆記", 25),
]

# Demo Flashcards
FLASHCARD_DATA = {
    "微積分": [
        ("什麼是極限？", "函數 f(x) 當 x 趨近 a 時的極限是 L，記作 lim(x→a) f(x) = L"),
        ("導數的定義是什麼？", "f'(x) = lim(h→0) [f(x+h) - f(x)] / h"),
        ("積分的幾何意義？", "積分表示函數曲線下方的面積"),
        ("連鎖律公式？", "(f(g(x)))' = f'(g(x)) · g'(x)"),
    ],
    "線性代數": [
        ("什麼是矩陣的秩？", "矩陣的秩是其行空間或列空間的維度"),
        ("特徵值的定義？", "Av = λv，其中 λ 是特徵值，v 是特徵向量"),
        ("單位矩陣的性質？", "IA = AI = A，對角線為1，其餘為0"),
    ],
    "普通物理": [
        ("牛頓第二定律？", "F = ma，力等於質量乘以加速度"),
        ("動能公式？", "E = ½mv²"),
        ("動量守恆定律？", "在無外力作用下，系統總動量保持不變"),
    ],
    "程式設計": [
        ("什麼是遞迴？", "函數調用自身的程式設計技巧"),
        ("時間複雜度 O(n) 是什麼意思？", "程式執行時間與輸入規模成線性關係"),
        ("什麼是資料結構？", "組織和儲存資料的方式，如陣列、鏈結串列、樹等"),
    ],
}

async def seed_demo_data():
    """Seed the database with demo data"""
    await db.connect()
    
    print("🌱 開始插入演示資料...\n")
    
    # 1. Create user if not exists
    user = await db.user.find_first()
    if not user:
        user = await db.user.create(data={
            "email": "demo@example.com",
            "name": "Ken"
        })
        print(f"✅ 創建用戶: {user.name}")
    else:
        print(f"✅ 使用現有用戶: {user.name}")
    
    user_id = user.id
    
    # 2. Create semester config
    semester_config = await db.semesterconfig.find_first(where={"userId": user_id})
    if not semester_config:
        await db.semesterconfig.create(data={
            "userId": user_id,
            "semesterName": "2024 秋季學期",
            "startDate": datetime.now() - timedelta(days=30),
            "endDate": datetime.now() + timedelta(days=90),
            "weeklyStudyHours": 20,
            "learningStyle": "visual"
        })
        print("✅ 創建學期配置")
    
    # 3. Create subjects
    created_subjects = []
    for subj in SUBJECTS:
        existing = await db.subject.find_first(where={"name": subj["name"], "userId": user_id})
        if not existing:
            subject = await db.subject.create(data={
                "name": subj["name"],
                "color": subj["color"],
                "userId": user_id
            })
            created_subjects.append(subject)
            print(f"✅ 創建科目: {subj['name']}")
        else:
            created_subjects.append(existing)
    
    # 4. Create exams for subjects
    for subject in created_subjects[:3]:  # Only first 3 subjects have exams
        existing_exam = await db.exam.find_first(where={"subjectId": subject.id})
        if not existing_exam:
            exam_date = datetime.now() + timedelta(days=random.randint(14, 45))
            await db.exam.create(data={
                "subjectId": subject.id,
                "examType": "midterm",
                "examDate": exam_date,
                "weight": random.randint(30, 50)
            })
            print(f"✅ 創建考試: {subject.name} 期中考 ({exam_date.strftime('%m/%d')})")
    
    # 5. Create tasks
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    task_count = 0
    
    for subject in created_subjects:
        for i, (template, minutes) in enumerate(TASK_TEMPLATES):
            # Create tasks for today, tomorrow, and next few days
            due_date = today + timedelta(days=i % 5)
            is_completed = random.random() < 0.3 and due_date < today
            
            title = template.format(subject=subject.name, chapter=random.randint(1, 10))
            
            existing = await db.task.find_first(where={"title": title, "userId": user_id})
            if not existing:
                await db.task.create(data={
                    "title": title,
                    "description": f"AI 自動生成的學習任務",
                    "subjectId": subject.id,
                    "userId": user_id,
                    "dueDate": due_date,
                    "priority": random.randint(1, 3),
                    "isCompleted": is_completed
                })
                task_count += 1
    
    print(f"✅ 創建 {task_count} 個任務")
    
    # 6. Create flashcards
    card_count = 0
    for subject in created_subjects:
        cards_data = FLASHCARD_DATA.get(subject.name, [])
        for front, back in cards_data:
            existing = await db.flashcard.find_first(where={"front": front})
            if not existing:
                await db.flashcard.create(data={
                    "front": front,
                    "back": back,
                    "subjectId": subject.id,
                    "userId": user_id,
                    "difficulty": random.uniform(4.0, 6.0),
                    "stability": random.uniform(1.0, 30.0),
                    "reps": random.randint(0, 10),
                    "lapses": random.randint(0, 3),
                    "state": random.randint(0, 2),
                    "lastReview": datetime.now() - timedelta(days=random.randint(1, 14)),
                    "due": datetime.now() + timedelta(days=random.randint(0, 7))
                })
                card_count += 1
    
    print(f"✅ 創建 {card_count} 張 Flashcards")
    
    # 7. Create study sessions
    session_count = 0
    for i in range(14):  # Last 14 days
        date = today - timedelta(days=i)
        # 1-3 sessions per day
        for _ in range(random.randint(1, 3)):
            subject = random.choice(created_subjects)
            duration = random.randint(15, 60)
            
            await db.studysession.create(data={
                "userId": user_id,
                "subjectId": subject.id,
                "startTime": date.replace(hour=random.randint(9, 21)),
                "duration": duration,
                "interruptions": random.randint(0, 5)
            })
            session_count += 1
    
    print(f"✅ 創建 {session_count} 個學習記錄")
    
    await db.disconnect()
    
    print("\n🎉 演示資料插入完成！")
    print("━" * 40)
    print(f"📚 科目: {len(created_subjects)}")
    print(f"📝 任務: {task_count}")
    print(f"🃏 Flashcards: {card_count}")
    print(f"⏱️ 學習記錄: {session_count}")
    print("━" * 40)

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
