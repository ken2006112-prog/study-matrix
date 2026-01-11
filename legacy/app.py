import streamlit as st
from utils.db import init_db, get_connection
from utils.ui import load_custom_css, render_card, render_header
import pandas as pd
from datetime import datetime

# 初始化資料庫
init_db()

# 載入全域樣式
load_custom_css()

# --- Helper Functions ---
def get_current_user():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users LIMIT 1")
    user = c.fetchone()
    conn.close()
    return user

def create_user(name, subjects):
    conn = get_connection()
    c = conn.cursor()
    # 1. Create User
    c.execute("INSERT INTO users (name) VALUES (?)", (name,))
    user_id = c.lastrowid
    
    # 2. Create Initial Goals (Subjects)
    for subject in subjects:
        c.execute("INSERT INTO goals (user_id, subject, target_score, target_date) VALUES (?, ?, ?, ?)",
                  (user_id, subject, 90, datetime.now().date())) # Default target
    
    conn.commit()
    conn.close()
    return user_id

# --- Onboarding Page ---
def render_onboarding():
    st.container()
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown("<div style='text-align: center; margin-top: 50px;'>", unsafe_allow_html=True)
        st.title("👋 歡迎來到 EduMate")
        st.markdown("您的個人化 AI 學習教練。讓我們花 1 分鐘認識您。")
        st.markdown("</div>", unsafe_allow_html=True)
        
        with st.form("onboarding_form"):
            name = st.text_input("請問怎麼稱呼您？", placeholder="例如：Ken")
            
            st.write("您目前專注於哪些科目？(可複選)")
            subjects_options = ["微積分", "線性代數", "計算機概論", "資料結構", "演算法", "作業系統", "英文", "經濟學", "心理學"]
            selected_subjects = st.multiselect("選擇科目", subjects_options)
            
            custom_subject = st.text_input("或是輸入其他科目 (選填)")
            
            submitted = st.form_submit_button("🚀 開始學習旅程", use_container_width=True)
            
            if submitted:
                if not name:
                    st.error("請輸入您的稱呼")
                elif not selected_subjects and not custom_subject:
                    st.error("請至少選擇或輸入一個科目")
                else:
                    final_subjects = selected_subjects
                    if custom_subject:
                        final_subjects.append(custom_subject)
                    
                    create_user(name, final_subjects)
                    st.success("設定完成！正在進入系統...")
                    st.rerun()

# --- Main Dashboard (Home) ---
def render_home(user):
    # === 側邊欄導航 (保持不變，但樣式會被 CSS 影響變簡約) ===
    with st.sidebar:
        st.markdown("## 📚 EduMate")
        st.divider()
        
        if st.button("🏠 Home", use_container_width=True, type="primary"):
            st.rerun()
        
        if st.button("📚 Learning Profile", use_container_width=True):
            st.switch_page("pages/1_📚_Learning_Profile.py")
        
        if st.button("📊 Dashboard", use_container_width=True):
            st.switch_page("pages/4_📊_Dashboard.py")
        
        if st.button("🗂️ Flashcards", use_container_width=True):
            st.switch_page("pages/5_🗂️_Flashcards.py")
        
        if st.button("📅 Study Planner", use_container_width=True):
            st.switch_page("pages/6_📅_Study_Planner.py")
        
        if st.button("📈 Weekly Report", use_container_width=True):
            st.switch_page("pages/8_📈_Weekly_Report.py")
        
        st.divider()
        st.caption(f"👤 {user['name']}")
    
    # === Notion Style Header ===
    # Cover Image (Random landscape or abstract)
    st.image("https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&w=2532&auto=format&fit=crop", use_column_width=True)
    
    # Page Icon & Title
    st.markdown("""
        <div style="margin-top: -60px; margin-bottom: 20px; position: relative; z-index: 1;">
            <div style="font-size: 78px;">🏡</div>
        </div>
    """, unsafe_allow_html=True)
    
    st.title(f"Home")
    
    # Quote / Greeting (Callout style)
    from utils.ui import render_notion_callout, render_notion_card
    render_notion_callout(f"**早安，{user['name']}！** 準備好開始今天的學習了嗎？", icon="👋")

    # === 獲取數據 ===
    conn = get_connection()
    today = datetime.now().date()
    from datetime import timedelta
    
    # 本週範圍
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    # 1. 今日待辦計畫
    today_plans_df = pd.read_sql_query(
        "SELECT * FROM study_plans WHERE date = ? ORDER BY is_completed, id", 
        conn, params=(today,)
    )
    pending_today = len(today_plans_df[today_plans_df['is_completed'] == 0])
    
    # 2. 待複習閃卡
    flashcards_df = pd.read_sql_query(
        "SELECT * FROM flashcards WHERE next_review_date <= ?", 
        conn, params=(today,)
    )
    due_cards = len(flashcards_df)
    
    # 3. 本週學習統計
    logs_df = pd.read_sql_query(
        "SELECT * FROM study_logs WHERE date(timestamp) >= ? AND date(timestamp) <= ?", 
        conn, params=(start_of_week, end_of_week)
    )
    total_study_minutes = logs_df['duration_minutes'].sum() if not logs_df.empty else 0
    total_study_hours = round(total_study_minutes / 60, 1)
    
    conn.close()
    
    # === Layout: Two Columns (Notion style) ===
    col_left, col_right = st.columns([2, 1])
    
    with col_left:
        st.subheader("📝 今日任務")
        
        if not today_plans_df.empty:
            for index, row in today_plans_df.iterrows():
                # Custom Checkbox Row
                col_c, col_t = st.columns([0.1, 0.9])
                with col_c:
                    # Streamlit checkbox is a bit large, but we use it for functionality
                    is_checked = st.checkbox("", value=bool(row['is_completed']), key=f"check_{row['id']}")
                    
                    # Handle state change
                    if is_checked != bool(row['is_completed']):
                        conn = get_connection()
                        c = conn.cursor()
                        new_val = 1 if is_checked else 0
                        c.execute(f"UPDATE study_plans SET is_completed={new_val} WHERE id={row['id']}")
                        conn.commit()
                        conn.close()
                        st.rerun()
                        
                with col_t:
                    if row['is_completed']:
                        st.markdown(f"<span style='color: #9CA3AF; text-decoration: line-through;'>{row['subject']}</span> <span style='color: #D1D5DB; font-size: 0.8em;'>({row['planned_minutes']} min)</span>", unsafe_allow_html=True)
                    else:
                        st.markdown(f"**{row['subject']}** <span style='color: #6B7280; font-size: 0.8em;'>({row['planned_minutes']} min)</span>", unsafe_allow_html=True)
        else:
            st.caption("今天沒有安排任務。")
            if st.button("➕ 新增任務"):
                st.switch_page("pages/6_📅_Study_Planner.py")

        st.markdown("")
        st.subheader("📌 快速導航")
        
        c1, c2 = st.columns(2)
        with c1:
            if st.button("📅 學習計畫表", use_container_width=True):
                st.switch_page("pages/6_📅_Study_Planner.py")
        with c2:
            if st.button("📚 學習檔案", use_container_width=True):
                st.switch_page("pages/1_📚_Learning_Profile.py")

    with col_right:
        st.subheader("ℹ️ 資訊欄")
        
        # Flashcard Status
        if due_cards > 0:
            render_notion_callout(f"**{due_cards}** 張卡片待複習", icon="🧠", bg_color="#FFF4E5") # Orange bg
            if st.button("開始複習", use_container_width=True):
                st.switch_page("pages/5_🗂️_Flashcards.py")
        else:
            render_notion_callout("目前沒有待複習卡片", icon="✅", bg_color="#E7F5E4") # Green bg
            
        # Weekly Stats
        st.markdown("---")
        st.caption("本週累計")
        st.metric("學習時數", f"{total_study_hours} h")
        
        if st.button("查看週報", use_container_width=True):
            st.switch_page("pages/8_📈_Weekly_Report.py")
            
        # Quick Actions
        st.markdown("---")
        st.caption("Actions")
        if st.button("📝 新增筆記/卡片", use_container_width=True):
            st.switch_page("pages/5_🗂️_Flashcards.py")

# --- Main Logic ---
user = get_current_user()

if user:
    render_home(user)
else:
    render_onboarding()
