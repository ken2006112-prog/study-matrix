"use client";

import { useState, useEffect, useRef } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    BookOpen,
    Target,
    Clock,
    Sparkles,
    Loader2,
    X,
    Check,
    LayoutGrid,
    Columns,
    List
} from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    type: "exam" | "study";
    subjectColor: string;
    details: {
        examType?: string;
        weight?: number;
        chapters?: string;
        hours?: number;
        priority?: string;
        tasks?: Array<{ chapter?: number; title?: string; hours?: number; task?: string }>;
        isCompleted?: boolean;
    };
}

interface Subject {
    id: number;
    name: string;
    color: string;
}

type ViewMode = "month" | "week" | "day";

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);

    // Form state
    const [eventForm, setEventForm] = useState({
        subjectId: 0,
        eventType: "exam" as "exam" | "study",
        examType: "midterm",
        date: "",
        startTime: "09:00",
        endTime: "10:00",
        weight: 20,
        startChapter: 1,
        endChapter: 5,
        title: ""
    });

    useEffect(() => {
        fetchData();
    }, [currentDate, viewMode]);

    const fetchData = async () => {
        try {
            let start: Date, end: Date;

            if (viewMode === "month") {
                start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            } else if (viewMode === "week") {
                const dayOfWeek = currentDate.getDay();
                start = new Date(currentDate);
                start.setDate(currentDate.getDate() - dayOfWeek);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
            } else {
                start = new Date(currentDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
            }

            const [eventsRes, subjectsRes] = await Promise.all([
                fetch(`http://localhost:8000/api/v1/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`),
                fetch("http://localhost:8000/api/v1/planner/subjects/")
            ]);

            if (eventsRes.ok) setEvents(await eventsRes.json());
            if (subjectsRes.ok) {
                const s = await subjectsRes.json();
                setSubjects(s);
                if (s.length > 0) setEventForm(f => ({ ...f, subjectId: s[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch calendar data:", error);
            // Demo data
            setEvents([
                {
                    id: "exam-1",
                    title: "微積分 期中考",
                    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString(),
                    startTime: "09:00",
                    endTime: "11:00",
                    type: "exam",
                    subjectColor: "#3B82F6",
                    details: { examType: "midterm", weight: 30, chapters: "1-5" }
                },
                {
                    id: "exam-2",
                    title: "線性代數 小考",
                    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20).toISOString(),
                    startTime: "14:00",
                    endTime: "15:00",
                    type: "exam",
                    subjectColor: "#8B5CF6",
                    details: { examType: "quiz", weight: 10, chapters: "3-4" }
                },
                {
                    id: "plan-1",
                    title: "Core Focus: 第1-2章",
                    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8).toISOString(),
                    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 14).toISOString(),
                    type: "study",
                    subjectColor: "#3B82F6",
                    details: { hours: 10, priority: "core", tasks: [{ chapter: 1, title: "導數", hours: 3 }] }
                }
            ]);
            setSubjects([
                { id: 1, name: "微積分", color: "#3B82F6" },
                { id: 2, name: "線性代數", color: "#8B5CF6" }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        try {
            if (eventForm.eventType === "exam") {
                const res = await fetch("http://localhost:8000/api/v1/calendar/exams", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subjectId: eventForm.subjectId,
                        examType: eventForm.examType,
                        examDate: new Date(eventForm.date + "T" + eventForm.startTime).toISOString(),
                        weight: eventForm.weight,
                        startChapter: eventForm.startChapter,
                        endChapter: eventForm.endChapter
                    })
                });
                if (res.ok) fetchData();
            }
            setShowAddEvent(false);
        } catch (error) {
            console.log("Demo mode");
            setShowAddEvent(false);
        }
    };

    const handleGeneratePlan = async (examId: string) => {
        setGeneratingPlan(true);
        try {
            const id = examId.replace("exam-", "");
            const res = await fetch(`http://localhost:8000/api/v1/calendar/generate-plan/${id}?weeklyHours=10`, {
                method: "POST"
            });
            if (res.ok) {
                const plan = await res.json();
                alert(`已生成 ${plan.weeksUntilExam} 週學習計劃！\n核心章節: ${plan.chapters.core?.length || 0} 章`);
                fetchData();
            }
        } catch (error) {
            alert("計劃生成示範模式");
        } finally {
            setGeneratingPlan(false);
        }
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setEventForm(f => ({
            ...f,
            date: date.toISOString().split('T')[0]
        }));
        setShowAddEvent(true);
    };

    const navigatePrev = () => {
        if (viewMode === "month") {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        } else if (viewMode === "week") {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() - 7);
            setCurrentDate(newDate);
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() - 1);
            setCurrentDate(newDate);
        }
    };

    const navigateNext = () => {
        if (viewMode === "month") {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        } else if (viewMode === "week") {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() + 7);
            setCurrentDate(newDate);
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() + 1);
            setCurrentDate(newDate);
        }
    };

    const goToToday = () => setCurrentDate(new Date());

    // Calendar helpers
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDay = (date: Date) => {
        return events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    const getWeekDays = () => {
        const days: Date[] = [];
        const dayOfWeek = currentDate.getDay();
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - dayOfWeek);

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "core": return "bg-primary text-white";
            case "support": return "bg-yellow-500 text-white";
            default: return "bg-secondary";
        }
    };

    const getDateTitle = () => {
        if (viewMode === "month") {
            return `${currentDate.getFullYear()} ${monthNames[currentDate.getMonth()]}`;
        } else if (viewMode === "week") {
            const weekDays = getWeekDays();
            const start = weekDays[0];
            const end = weekDays[6];
            return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
        } else {
            return `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${currentDate.getDate()} (${dayNames[currentDate.getDay()]})`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-bold hidden sm:block">學習日曆</h1>
                        </div>

                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary"
                        >
                            今天
                        </button>

                        <div className="flex items-center">
                            <button onClick={navigatePrev} className="p-1.5 hover:bg-secondary rounded-lg">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={navigateNext} className="p-1.5 hover:bg-secondary rounded-lg">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-lg font-semibold">{getDateTitle()}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Selector */}
                        <div className="flex border border-border rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode("day")}
                                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === "day" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">日</span>
                            </button>
                            <button
                                onClick={() => setViewMode("week")}
                                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === "week" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                            >
                                <Columns className="w-4 h-4" />
                                <span className="hidden sm:inline">週</span>
                            </button>
                            <button
                                onClick={() => setViewMode("month")}
                                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === "month" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">月</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowAddEvent(true)}
                            className="gradient-button"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">新增</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="max-w-7xl mx-auto">
                {viewMode === "month" && (
                    <MonthView
                        currentDate={currentDate}
                        events={events}
                        onDateClick={handleDateClick}
                        onEventClick={setSelectedEvent}
                        firstDayOfMonth={firstDayOfMonth}
                        daysInMonth={daysInMonth}
                        dayNames={dayNames}
                        getEventsForDay={getEventsForDay}
                        getPriorityColor={getPriorityColor}
                    />
                )}

                {viewMode === "week" && (
                    <WeekView
                        weekDays={getWeekDays()}
                        events={events}
                        hours={hours}
                        onDateClick={handleDateClick}
                        onEventClick={setSelectedEvent}
                        dayNames={dayNames}
                        getEventsForDay={getEventsForDay}
                    />
                )}

                {viewMode === "day" && (
                    <DayView
                        currentDate={currentDate}
                        events={getEventsForDay(currentDate)}
                        hours={hours}
                        onTimeClick={(hour) => {
                            setEventForm(f => ({
                                ...f,
                                date: currentDate.toISOString().split('T')[0],
                                startTime: `${hour.toString().padStart(2, '0')}:00`,
                                endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
                            }));
                            setShowAddEvent(true);
                        }}
                        onEventClick={setSelectedEvent}
                    />
                )}
            </div>

            {/* Add Event Modal */}
            {showAddEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">新增事件</h3>
                            <button onClick={() => setShowAddEvent(false)} className="p-2 hover:bg-secondary rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Event Type */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEventForm(f => ({ ...f, eventType: "exam" }))}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${eventForm.eventType === "exam" ? "bg-red-500 text-white" : "bg-secondary"
                                        }`}
                                >
                                    <Target className="w-4 h-4" />
                                    考試
                                </button>
                                <button
                                    onClick={() => setEventForm(f => ({ ...f, eventType: "study" }))}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${eventForm.eventType === "study" ? "bg-primary text-white" : "bg-secondary"
                                        }`}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    學習
                                </button>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">科目</label>
                                <select
                                    value={eventForm.subjectId}
                                    onChange={e => setEventForm({ ...eventForm, subjectId: Number(e.target.value) })}
                                    className="apple-input"
                                >
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {eventForm.eventType === "exam" && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">考試類型</label>
                                        <div className="flex gap-2">
                                            {[["期中考", "midterm"], ["期末考", "final"], ["小考", "quiz"]].map(([label, value]) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setEventForm({ ...eventForm, examType: value })}
                                                    className={`flex-1 py-2 rounded-lg text-sm ${eventForm.examType === value ? "bg-primary text-white" : "bg-secondary"
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">起始章節</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={eventForm.startChapter}
                                                onChange={e => setEventForm({ ...eventForm, startChapter: Number(e.target.value) })}
                                                className="apple-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">結束章節</label>
                                            <input
                                                type="number"
                                                min={eventForm.startChapter}
                                                value={eventForm.endChapter}
                                                onChange={e => setEventForm({ ...eventForm, endChapter: Number(e.target.value) })}
                                                className="apple-input"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">佔分: {eventForm.weight}%</label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={5}
                                            value={eventForm.weight}
                                            onChange={e => setEventForm({ ...eventForm, weight: Number(e.target.value) })}
                                            className="w-full accent-primary"
                                        />
                                    </div>
                                </>
                            )}

                            {eventForm.eventType === "study" && (
                                <div>
                                    <label className="text-sm font-medium mb-2 block">學習內容</label>
                                    <input
                                        type="text"
                                        value={eventForm.title}
                                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                        placeholder="例如：複習第三章"
                                        className="apple-input"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium mb-2 block">日期</label>
                                <input
                                    type="date"
                                    value={eventForm.date}
                                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                                    className="apple-input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">開始時間</label>
                                    <input
                                        type="time"
                                        value={eventForm.startTime}
                                        onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })}
                                        className="apple-input"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">結束時間</label>
                                    <input
                                        type="time"
                                        value={eventForm.endTime}
                                        onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })}
                                        className="apple-input"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateEvent}
                                className="w-full gradient-button py-3"
                            >
                                <Check className="w-4 h-4" />
                                儲存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-background rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                                style={{ backgroundColor: selectedEvent.subjectColor }}
                            >
                                {selectedEvent.type === "exam" ? <Target className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold">{selectedEvent.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(selectedEvent.date).toLocaleDateString('zh-TW')}
                                    {selectedEvent.startTime && ` ${selectedEvent.startTime}`}
                                </p>
                            </div>
                        </div>

                        {selectedEvent.type === "exam" && (
                            <div className="space-y-2">
                                <div className="flex justify-between py-2 border-b border-border/30">
                                    <span className="text-muted-foreground">類型</span>
                                    <span className="font-medium capitalize">{selectedEvent.details.examType}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border/30">
                                    <span className="text-muted-foreground">佔分</span>
                                    <span className="font-medium">{selectedEvent.details.weight}%</span>
                                </div>
                                {selectedEvent.details.chapters && (
                                    <div className="flex justify-between py-2 border-b border-border/30">
                                        <span className="text-muted-foreground">範圍</span>
                                        <span className="font-medium">第 {selectedEvent.details.chapters} 章</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        handleGeneratePlan(selectedEvent.id);
                                        setSelectedEvent(null);
                                    }}
                                    disabled={generatingPlan}
                                    className="w-full gradient-button py-3 mt-4"
                                >
                                    {generatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    生成 80/20 讀書計劃
                                </button>
                            </div>
                        )}

                        {selectedEvent.type === "study" && (
                            <div className="space-y-2">
                                <div className="flex justify-between py-2 border-b border-border/30">
                                    <span className="text-muted-foreground">專注</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(selectedEvent.details.priority || "")}`}>
                                        {selectedEvent.details.priority === "core" ? "核心 20%" :
                                            selectedEvent.details.priority === "support" ? "支撐 30%" : "細節"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border/30">
                                    <span className="text-muted-foreground">時數</span>
                                    <span className="font-medium">{selectedEvent.details.hours} 小時</span>
                                </div>
                                {selectedEvent.details.tasks && selectedEvent.details.tasks.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-sm font-medium mb-2">任務</p>
                                        {selectedEvent.details.tasks.map((task, i) => (
                                            <div key={i} className="flex items-center gap-2 py-1 text-sm">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>{task.chapter ? `第 ${task.chapter} 章` : task.task}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="w-full apple-button-secondary mt-4"
                        >
                            關閉
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Month View Component
function MonthView({ currentDate, events, onDateClick, onEventClick, firstDayOfMonth, daysInMonth, dayNames, getEventsForDay, getPriorityColor }: {
    currentDate: Date;
    events: CalendarEvent[];
    onDateClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    firstDayOfMonth: number;
    daysInMonth: number;
    dayNames: string[];
    getEventsForDay: (date: Date) => CalendarEvent[];
    getPriorityColor: (p: string) => string;
}) {
    return (
        <div className="border-t border-border/30">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-secondary/20">
                {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-border/30 last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {/* Empty cells */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[100px] p-1 border-r border-b border-border/30 bg-secondary/5" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayEvents = getEventsForDay(date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    return (
                        <div
                            key={day}
                            onClick={() => onDateClick(date)}
                            className={`min-h-[100px] p-1 border-r border-b border-border/30 cursor-pointer transition-colors ${isToday ? 'bg-primary/5' : isWeekend ? 'bg-secondary/10' : 'hover:bg-secondary/20'
                                }`}
                        >
                            <div className={`text-sm mb-1 px-1 ${isToday
                                    ? 'w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center mx-auto'
                                    : isWeekend ? 'text-muted-foreground' : ''
                                }`}>
                                {day}
                            </div>
                            <div className="space-y-0.5">
                                {dayEvents.slice(0, 3).map(event => (
                                    <button
                                        key={event.id}
                                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                        className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate block ${event.type === "exam"
                                                ? "text-white"
                                                : getPriorityColor(event.details.priority || "")
                                            }`}
                                        style={event.type === "exam" ? { backgroundColor: event.subjectColor } : undefined}
                                    >
                                        {event.startTime && <span className="opacity-70">{event.startTime.slice(0, 5)} </span>}
                                        {event.title}
                                    </button>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3} 更多</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Week View Component
function WeekView({ weekDays, events, hours, onDateClick, onEventClick, dayNames, getEventsForDay }: {
    weekDays: Date[];
    events: CalendarEvent[];
    hours: number[];
    onDateClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    dayNames: string[];
    getEventsForDay: (date: Date) => CalendarEvent[];
}) {
    return (
        <div className="flex border-t border-border/30">
            {/* Time column */}
            <div className="w-16 flex-shrink-0 border-r border-border/30">
                <div className="h-12 border-b border-border/30" /> {/* Header spacer */}
                {hours.map(hour => (
                    <div key={hour} className="h-12 text-xs text-muted-foreground text-right pr-2 pt-0 border-b border-border/10">
                        {hour.toString().padStart(2, '0')}:00
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="flex-1 grid grid-cols-7">
                {weekDays.map((date, i) => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    const dayEvents = getEventsForDay(date);

                    return (
                        <div key={i} className="border-r border-border/30 last:border-r-0">
                            {/* Day header */}
                            <div
                                onClick={() => onDateClick(date)}
                                className={`h-12 flex flex-col items-center justify-center border-b border-border/30 cursor-pointer hover:bg-secondary/20 ${isToday ? 'bg-primary/5' : ''}`}
                            >
                                <span className="text-xs text-muted-foreground">{dayNames[date.getDay()]}</span>
                                <span className={`text-sm font-medium ${isToday ? 'w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center' : ''}`}>
                                    {date.getDate()}
                                </span>
                            </div>

                            {/* Hour cells */}
                            <div className="relative">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        onClick={() => onDateClick(date)}
                                        className="h-12 border-b border-border/10 hover:bg-secondary/10 cursor-pointer"
                                    />
                                ))}

                                {/* Events overlay */}
                                {dayEvents.map(event => {
                                    if (!event.startTime) return null;
                                    const startHour = parseInt(event.startTime.split(':')[0]);
                                    const endHour = event.endTime ? parseInt(event.endTime.split(':')[0]) : startHour + 1;
                                    const top = startHour * 48;
                                    const height = (endHour - startHour) * 48;

                                    return (
                                        <button
                                            key={event.id}
                                            onClick={() => onEventClick(event)}
                                            className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs text-white overflow-hidden z-10"
                                            style={{
                                                top: `${top}px`,
                                                height: `${Math.max(height - 2, 20)}px`,
                                                backgroundColor: event.subjectColor
                                            }}
                                        >
                                            <div className="font-medium truncate">{event.title}</div>
                                            {height > 30 && <div className="opacity-70">{event.startTime}</div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Day View Component
function DayView({ currentDate, events, hours, onTimeClick, onEventClick }: {
    currentDate: Date;
    events: CalendarEvent[];
    hours: number[];
    onTimeClick: (hour: number) => void;
    onEventClick: (event: CalendarEvent) => void;
}) {
    return (
        <div className="flex border-t border-border/30">
            {/* Time column */}
            <div className="w-20 flex-shrink-0 border-r border-border/30">
                {hours.map(hour => (
                    <div key={hour} className="h-16 text-sm text-muted-foreground text-right pr-3 pt-0 border-b border-border/10">
                        {hour.toString().padStart(2, '0')}:00
                    </div>
                ))}
            </div>

            {/* Day content */}
            <div className="flex-1 relative">
                {hours.map(hour => (
                    <div
                        key={hour}
                        onClick={() => onTimeClick(hour)}
                        className="h-16 border-b border-border/10 hover:bg-secondary/10 cursor-pointer"
                    />
                ))}

                {/* Events */}
                {events.map(event => {
                    if (!event.startTime) return null;
                    const startHour = parseInt(event.startTime.split(':')[0]);
                    const startMin = parseInt(event.startTime.split(':')[1]) || 0;
                    const endHour = event.endTime ? parseInt(event.endTime.split(':')[0]) : startHour + 1;
                    const endMin = event.endTime ? parseInt(event.endTime.split(':')[1]) || 0 : 0;

                    const top = startHour * 64 + (startMin / 60) * 64;
                    const height = ((endHour - startHour) * 64) + ((endMin - startMin) / 60) * 64;

                    return (
                        <button
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="absolute left-2 right-2 rounded-lg px-3 py-2 text-white overflow-hidden z-10 shadow-lg"
                            style={{
                                top: `${top}px`,
                                height: `${Math.max(height - 4, 40)}px`,
                                backgroundColor: event.subjectColor
                            }}
                        >
                            <div className="font-semibold">{event.title}</div>
                            <div className="text-sm opacity-80">{event.startTime} - {event.endTime}</div>
                            {event.details.chapters && (
                                <div className="text-sm opacity-70 mt-1">範圍: 第 {event.details.chapters} 章</div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
