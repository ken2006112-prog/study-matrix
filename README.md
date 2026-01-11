# 🧠 AI Learning Assistant

> An intelligent, data-driven learning platform that adapts to your study patterns and optimizes effectiveness through science-backed algorithms.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-14-black.svg)

---

## ✨ Features

### 📋 Smart Task Management
- **TickTick-style Interface**: 3-column layout with smart lists (Inbox, Today, Next 7 Days)
- **Subject Integration**: Filter and organize tasks by subject
- **Date Grouping**: Automatic categorization (Overdue, Today, Tomorrow, This Week)
- **Priority System**: Visual priority flags (High/Medium/Low)

### ⏱️ Enhanced Study Timer
- **Pomodoro Mode**: Customizable intervals (15/25/45/60 minutes)
- **Interruption Tracking**: Monitor focus quality
- **Time Accuracy**: Real-time comparison of planned vs actual time
- **Automatic Logging**: Session data saved for analysis

### 📊 Analytics Dashboard
- **Study Metrics**: Total hours, task completion, success rates
- **Time Honesty Analysis**: Track estimation accuracy
- **Subject Progress**: Visual progress bars per subject
- **Concept Cloud**: AI-powered keyword extraction from study materials

### 🧠 FSRS-4.5 Spaced Repetition
- **Science-Based Algorithm**: Optimal review scheduling
- **Memory Modeling**: Stability and difficulty calculations
- **Retrievability Prediction**: Know when you'll forget
- **Adaptive Intervals**: Personalized review timing

### 🎓 Semester Configuration
- **Onboarding Wizard**: 5-step conversational setup
- **Exam Management**: Track midterms and finals
- **Learning Preferences**: Visual/Reading/Practice/Discussion
- **Time Planning**: Weekly availability assessment

---

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: SQLite with Prisma ORM
- **Algorithms**: Custom FSRS-4.5 implementation
- **NLP**: Concept extraction and analysis

### Frontend
- **Framework**: Next.js 14 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ken2006112-prog/study-matrix.git
cd study-matrix
```

2. **Run the development script**
```bash
bash start_dev.sh
```

This will:
- Set up Python virtual environment
- Install backend dependencies
- Generate Prisma client
- Install frontend dependencies
- Start both servers concurrently

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📖 Usage

### Dashboard (`/dashboard`)
- **Study Timer**: Select subject, set duration, start focusing
- **Analytics**: View study statistics and Time Honesty ratio
- **Concept Extraction**: Paste text to generate knowledge cloud

### Planner (`/planner`)
- **Create Tasks**: Add tasks with subjects, due dates, priorities
- **Filter by Subject**: Click subjects in sidebar to filter
- **Smart Lists**: View tasks by Inbox/Today/Next 7 Days

### Flashcards (`/flashcards`)
- **Create Cards**: Front/back with subject association
- **Review**: Rate recall (Again/Hard/Good/Easy)
- **FSRS Scheduling**: Automatic optimal interval calculation

---

## 📊 Data Models

### Core Models
- **User**: Profile and preferences
- **Subject**: Courses with color coding
- **Task**: Todos with subject, priority, due date
- **StudySession**: Timer logs with interruption tracking
- **Flashcard**: FSRS-enhanced review cards
- **SemesterConfig**: Semester setup and preferences
- **Exam**: Midterm/final tracking per subject

### FSRS Fields
- `stability`: Memory stability (days)
- `difficulty`: Learning difficulty (1-10)
- `retrievability`: Recall probability (0-1)
- `due`: Next optimal review date

---

## 📚 Documentation

- **[User Guide](/.gemini/antigravity/brain/12974af3-5a73-4c25-8e28-93ebcf470ccf/user_guide.md)**: Complete usage instructions
- **[System Overview](/.gemini/antigravity/brain/12974af3-5a73-4c25-8e28-93ebcf470ccf/complete_summary.md)**: Architecture and features
- **[Walkthrough](/.gemini/antigravity/brain/12974af3-5a73-4c25-8e28-93ebcf470ccf/walkthrough.md)**: Feature demonstrations
- **[Master Plan](/.gemini/antigravity/brain/12974af3-5a73-4c25-8e28-93ebcf470ccf/master_plan.md)**: Development roadmap

---

## 🎯 Key Metrics

Track your learning effectiveness:
- ✅ **Time Honesty**: ≥80% (planned vs actual)
- ✅ **Focus Quality**: ≤2 interruptions/hour
- ✅ **Task Completion**: ≥70% weekly
- ✅ **Flashcard Success**: ≥85% retention

---

## 🔧 API Endpoints

### Tasks
```
GET    /api/v1/tasks?subjectId={id}
POST   /api/v1/tasks
PUT    /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
```

### Flashcards
```
GET  /api/v1/cards/due
POST /api/v1/cards/reviews
GET  /api/v1/cards/stats
```

### Analytics
```
GET /api/v1/analytics/summary
GET /api/v1/analytics/weekly_report
GET /api/v1/analytics/recommendations
```

---

## 🧪 FSRS Algorithm

The Free Spaced Repetition Scheduler optimizes review intervals:

```python
# Memory stability calculation
stability = f(old_stability, difficulty, rating, state)

# Optimal interval
interval = stability × 9 × (1/retention - 1)

# Current retrievability
retrievability = (1 + elapsed/(9×stability))^-1
```

**Rating Scale:**
- **Again (1)**: Complete blackout → 1 day
- **Hard (2)**: Difficult recall → Short interval
- **Good (3)**: Normal recall → Standard interval
- **Easy (4)**: Perfect recall → Long interval

---

## 🛠️ Development

### Project Structure
```
study-matrix/
├── backend/
│   ├── app/
│   │   ├── routers/       # API endpoints
│   │   ├── utils/         # FSRS algorithm
│   │   └── services/      # NLP, analytics
│   └── prisma/
│       └── schema.prisma  # Database schema
├── frontend/
│   └── src/
│       ├── app/           # Next.js pages
│       └── components/    # React components
└── start_dev.sh           # Development launcher
```

### Adding Features
1. Update database schema in `backend/prisma/schema.prisma`
2. Run `prisma db push` and `prisma generate`
3. Create API endpoints in `backend/app/routers/`
4. Build frontend components in `frontend/src/components/`
5. Update documentation

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

---

## 🎓 Learning Science

This system implements evidence-based learning techniques:
- **Spaced Repetition**: FSRS-4.5 algorithm
- **Active Recall**: Question-driven review
- **Metacognition**: Time Honesty analysis
- **Progress Tracking**: Data-driven insights

---

## 🌟 Acknowledgments

- FSRS algorithm by [Jarrett Ye](https://github.com/open-spaced-repetition/fsrs4anki)
- UI inspiration from TickTick
- Built with modern web technologies

---

**Made with ❤️ for effective learning**
