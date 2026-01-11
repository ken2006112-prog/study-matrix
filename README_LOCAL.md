# 如何在本地運行 Study Matrix

由於網頁版可能不穩定，您可以選擇在本地端運行此專案。

## 前置需求

請確保您的電腦已安裝以下軟體：
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

## 快速啟動

我們提供了一個自動化腳本來幫您一次啟動後端和前端。

1. 打開終端機 (Terminal)。
2. 進入專案根目錄。
3. 執行以下指令：

```bash
bash start_dev.sh
```

這個腳本會自動完成以下動作：
- 建立並啟動 Python 虛擬環境
- 安裝後端依賴 (FastAPI, Prisma 等)
- 生成 Prisma Client
- 安裝前端依賴 (Next.js, Electron 等)
- 啟動後端與前端伺服器
- **自動開啟桌面應用程式視窗**

## 手動啟動 (如果不使用腳本)

如果您希望分開啟動，請依照以下步驟：

### 1. 啟動後端

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 2. 啟動前端 (桌面版)

```bash
cd frontend
npm run dev &  # 先啟動 Next.js
npm run electron # 再啟動 Electron 視窗
```

## 常見問題

- **Port 被佔用**：如果看到錯誤提示 Port 3000 或 8000 已被佔用，請先關閉佔用該 Port 的程式。
- **Prisma 錯誤**：如果遇到資料庫相關錯誤，請嘗試執行 `cd backend && prisma generate`。
