# Study Matrix - AI 學習助手

> 基於認知科學的智能學習平台

---

## 🚀 快速開始

### 後端
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
prisma generate
prisma migrate dev
uvicorn app.main:app --reload --port 8000
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

---

## 📋 功能總覽

| 功能 | 說明 | 頁面 |
|------|------|------|
| 📅 學習日曆 | Google Calendar 風格，考試管理 | `/calendar` |
| 🎯 艾森豪矩陣 | 四象限任務管理 | `/matrix` |
| 📚 閃卡系統 | FSRS 間隔重複算法 | `/flashcards` |
| 📈 週報分析 | AI 學習分析+建議 | `/reports` |
| 🧠 AI 教練 | 全數據分析+個性化建議 | `/coach` |
| 📂 教材上傳 | 自動生成閃卡 | `/materials` |
| ⏱️ 學習計時 | 番茄鐘+專注模式 | `/dashboard` |

---

## 🏗️ 技術架構

```
┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   FastAPI   │
│  Frontend   │     │   Backend   │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Prisma    │
                    │   SQLite    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   OpenAI    │
                    │    API      │
                    └─────────────┘
```

---

## 📁 專案結構

```
study-matrix/
├── backend/           # Python FastAPI
│   ├── app/
│   │   ├── routers/  # 18 個 API 路由
│   │   ├── services/ # 7 個業務服務
│   │   └── main.py   # 應用入口
│   └── prisma/       # 資料庫 Schema
│
├── frontend/          # Next.js React
│   └── src/
│       ├── app/      # 18 個頁面
│       └── components/ # 30+ 組件
│
└── docker-compose.yml
```

---

## 🔑 環境變數

```env
# backend/.env
DATABASE_URL="file:../edumate.db"
OPENAI_API_KEY="sk-..."
JWT_SECRET="your-secret"
```

---

## 📖 文檔

- [系統架構](/.gemini/brain/.../system_architecture.md)
- [設計原則](/.gemini/brain/.../design_principles.md)

---

## 📄 License

MIT
