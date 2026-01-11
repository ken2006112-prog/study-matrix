# 🚀 AI 學習助理 - 使用指南

## 快速開始

### 1️⃣ 啟動服務（已完成）
```bash
bash start_dev.sh
```

### 2️⃣ 打開應用
在瀏覽器訪問：**http://localhost:3000**

---

## 📱 五個核心頁面

| 頁面 | 網址 | 用途 |
|------|------|------|
| **📥 Inbox** | http://localhost:3000/inbox | 學習想法緩衝區 |
| **⭐ Today** | http://localhost:3000/today | 今日學習任務（核心）|
| **📅 Upcoming** | http://localhost:3000/upcoming | AI規劃的未來任務 |
| **📚 Subjects** | http://localhost:3000/subjects | 科目管理與進度 |
| **📊 Insights** | http://localhost:3000/insights | 學習數據分析 |

---

## 🎯 典型使用流程

### 新用戶入門
1. 訪問 http://localhost:3000
2. 完成 5 步驟 Onboarding（設定科目、考試日期）
3. AI 自動生成學習計畫

### 每日學習
1. 打開 **Today** 頁面
2. 看 **Focus Task**（AI推薦最該做的事）
3. 點擊「開始學習」
4. 學習完成後評分反饋

### 複習 Flashcards
1. 訪問 http://localhost:3000/flashcards
2. 選擇科目
3. 對每張卡片評分 1-4
4. FSRS 自動安排下次複習

---

## 🔌 API 測試

後端 API 文檔：**http://localhost:8000/docs**

常用端點：
```
GET  /api/v1/tasks/           獲取任務
POST /api/v1/tasks/           創建任務
GET  /api/v1/cards/           獲取 Flashcards
GET  /api/v1/analytics/summary 學習數據
GET  /api/v1/prompts/categories AI提問分類
```

---

## ❓ 常見問題

### Port 被佔用
```bash
# 查看佔用
lsof -i :3000 -i :8000

# 強制釋放
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:8000)
```

### 資料庫問題
```bash
cd backend
source .venv/bin/activate
prisma generate
prisma db push
```

### 重啟服務
```bash
# 停止所有
pkill -f "uvicorn"
pkill -f "next"

# 重新啟動
bash start_dev.sh
```

---

## 📚 更多資源

- [設計原則](file:///Users/ken/.gemini/antigravity/brain/12974af3-5a73-4c25-8e28-93ebcf470ccf/design_principles.md)
- [系統架構](file:///Users/ken/.gemini/antigravity/brain/12974af3-5a73-4c25-8e28-93ebcf470ccf/system_architecture.md)
- [競爭分析](file:///Users/ken/.gemini/antigravity/brain/12974af3-5a73-4c25-8e28-93ebcf470ccf/competitive_analysis.md)
