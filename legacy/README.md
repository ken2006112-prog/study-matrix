# EduMate - 智慧學習夥伴 🎓

EduMate 是一個基於 **Streamlit** 的個人化 AI 學習助理，結合了科學化學習方法（如 FSRS 間隔重複、交錯練習）與數據分析，幫助您更有效率地學習。

## ✨ 主要功能

*   **📊 學習儀表板**：追蹤學習時數、測驗成績與記憶保留率。
*   **🗂️ 智慧 Flashcards**：內建 FSRS 演算法，根據記憶曲線自動安排複習時間。
*   **📅 學習計畫**：管理每日待辦事項，並具備「時間誠實度」分析功能。
*   **📈 每週適應性報告**：每週分析學習成效並提供調整建議。
*   **🎨 極簡美學**：現代化卡片式介面，提供舒適的學習體驗。

## 🚀 如何在本地端執行 (How to Run Locally)

### 1. 安裝環境

確保您已安裝 Python (建議 3.9+)。

```bash
# 1. 建立虛擬環境 (可選但推薦)
python -m venv .venv

# Windows 啟用虛擬環境
.venv\Scripts\activate

# Mac/Linux 啟用虛擬環境
source .venv/bin/activate
```

### 2. 安裝套件

```bash
pip install -r requirements.txt
```

### 3. 啟動應用程式

```bash
streamlit run app.py
```

啟動後，瀏覽器將自動開啟 `http://localhost:8501`。

## 📂 專案結構

*   `app.py`: 主程式入口 (首頁與導航)。
*   `pages/`: 各功能頁面 (Flashcards, Study Planner, Dashboard, Weekly Report)。
*   `utils/`:
    *   `db.py`: SQLite 資料庫管理。
    *   `ui.py`: 全域 UI 樣式與 Helper Functions。
    *   `fsrs.py`: FSRS 記憶演算法實作。
    *   `ai_models.py`: 數據分析與預測模型。
*   `data/`: 存放 SQLite 資料庫 (`edumate.db`)。

## 🛠️ 技術堆疊

*   **Frontend/Backend**: Streamlit (Python)
*   **Database**: SQLite
*   **Data Analysis**: Pandas, NumPy, Scikit-learn
*   **Visualization**: Plotly
