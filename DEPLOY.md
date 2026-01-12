# 🚀 Study Matrix 部署指南

## 1. 部署到 Vercel (Frontend)

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
cd frontend
vercel
```

### 環境變數設定
在 Vercel Dashboard 設定：
- `NEXT_PUBLIC_API_URL`: 你的後端 API URL

---

## 2. 部署到 Railway (Backend)

```bash
# 安裝 Railway CLI
npm i -g @railway/cli

# 部署
cd backend
railway up
```

### Railway 環境變數
- `DATABASE_URL`: PostgreSQL 連線字串
- `JWT_SECRET`: 隨機產生的密鑰
- `OPENAI_API_KEY`: OpenAI API Key

---

## 3. 資料庫 (PostgreSQL)

### 選項 A: Railway PostgreSQL
```bash
railway add postgresql
```

### 選項 B: Supabase
1. 前往 https://supabase.com
2. 創建新專案
3. 複製 Database URL

### 初始化資料庫
```bash
cd backend
prisma db push
```

---

## 4. 網域設定

### Frontend (Vercel)
1. 前往 Vercel Dashboard
2. Settings > Domains
3. 添加你的網域

### Backend (Railway)
1. 前往 Railway Dashboard
2. Settings > Domains
3. 添加 API 子網域 (例如 api.yourdomain.com)

---

## 5. 環境變數完整清單

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://yourdomain.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
```

---

## 6. Stripe 付費整合

1. 前往 https://stripe.com 創建帳號
2. 獲取 API Keys
3. 設定 Webhook endpoint: `https://api.yourdomain.com/api/v1/payments/webhook`
4. 添加環境變數

---

## 7. 監控與 Analytics

### 推薦工具
- **Sentry**: 錯誤追蹤
- **Posthog**: 產品分析
- **Uptime Robot**: 服務監控

---

## 快速部署 Checklist

- [ ] 部署 PostgreSQL 資料庫
- [ ] 設定後端環境變數
- [ ] 部署後端到 Railway
- [ ] 設定前端環境變數
- [ ] 部署前端到 Vercel
- [ ] 設定網域 DNS
- [ ] 測試登入/註冊流程
- [ ] 設定 Stripe (可選)
- [ ] 設定 Google OAuth (可選)
