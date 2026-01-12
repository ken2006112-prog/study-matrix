"use client";

import { useEffect, useState } from "react";
import { Task, TaskCreate, TaskUpdate } from "@/types/task";
import { fetchTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import { fetchSubjects } from "@/lib/api";
import { QuickAddTask } from "./QuickAddTask";
import { TaskList } from "./TaskList";
import { TaskDetail } from "./TaskDetail";
import { TaskSidebar } from "./TaskSidebar";
import { isToday, isWithinInterval, addDays, startOfToday, endOfDay } from "date-fns";

type SmartList = "inbox" | "today" | "next7days";

interface Subject {
    id: number;
    name: string;
    color: string;
}

export function TaskLayout() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedList, setSelectedList] = useState<SmartList | number>("inbox");
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const data = await fetchTasks();
            setTasks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSubjects = async () => {
        try {
            const data = await fetchSubjects();
            setSubjects(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadTasks();
        loadSubjects();
    }, []);

    // Filter tasks based on selected list
    const filteredTasks = tasks.filter(task => {
        if (task.isCompleted) return false; // Hide completed tasks

        // If a subject is selected (number), filter by subject
        if (typeof selectedList === 'number') {
            return task.subjectId === selectedList;
        }

        // Smart list filtering
        switch (selectedList) {
            case "today":
                return task.dueDate && isToday(new Date(task.dueDate));
            case "next7days":
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                const today = startOfToday();
                const next7Days = endOfDay(addDays(today, 7));
                return isWithinInterval(dueDate, { start: today, end: next7Days });
            case "inbox":
            default:
                return true; // Show all incomplete tasks
        }
    });

    // Calculate counts for sidebar
    const taskCounts = {
        inbox: tasks.filter(t => !t.isCompleted).length,
        today: tasks.filter(t => !t.isCompleted && t.dueDate && isToday(new Date(t.dueDate))).length,
        next7days: tasks.filter(t => {
            if (t.isCompleted || !t.dueDate) return false;
            const dueDate = new Date(t.dueDate);
            const today = startOfToday();
            const next7Days = endOfDay(addDays(today, 7));
            return isWithinInterval(dueDate, { start: today, end: next7Days });
        }).length,
        bySubject: subjects.reduce((acc, subject) => {
            acc[subject.id] = tasks.filter(t => !t.isCompleted && t.subjectId === subject.id).length;
            return acc;
        }, {} as Record<number, number>)
    };

    const handleCreateTask = async (taskData: TaskCreate) => {
        try {
            const newTask = await createTask(taskData);
            setTasks([newTask, ...tasks]);
            setSelectedTaskId(newTask.id);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateTask = async (taskId: number, updates: TaskUpdate) => {
        // Optimistic update
        setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));

        try {
            const updated = await updateTask(taskId, updates);
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        } catch (error) {
            console.error(error);
            loadTasks(); // Revert on error
        }
    };

    const handleToggleComplete = async (taskId: number, currentStatus: boolean) => {
        handleUpdateTask(taskId, { isCompleted: !currentStatus });
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            await deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
            if (selectedTaskId === taskId) setSelectedTaskId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    const getListTitle = () => {
        if (typeof selectedList === 'number') {
            const subject = subjects.find(s => s.id === selectedList);
            return subject?.name || "Unknown Subject";
        }

        switch (selectedList) {
            case "today": return "Today";
            case "next7days": return "Next 7 Days";
            case "inbox":
            default: return "Inbox";
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            {/* Left: Smart Lists Sidebar */}
            <TaskSidebar
                selectedList={selectedList}
                onSelectList={setSelectedList}
                taskCounts={taskCounts}
                subjects={subjects}
            />

            {/* Middle: Task List */}
            <div className="flex-1 flex flex-col min-w-[300px] max-w-[500px] border-r">
                <div className="p-4 border-b space-y-3">
                    <h1 className="text-xl font-bold">{getListTitle()}</h1>
                    <QuickAddTask onAddTask={handleCreateTask} subjects={subjects} />
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p className="text-sm">Loading...</p>
                        </div>
                    ) : (
                        <TaskList
                            tasks={filteredTasks}
                            selectedTaskId={selectedTaskId}
                            onSelectTask={setSelectedTaskId}
                            onToggleComplete={handleToggleComplete}
                        />
                    )}
                </div>
            </div>

            {/* Right: Task Detail */}
            {selectedTask ? (
                <div className="flex-1 max-w-[600px]">
                    <TaskDetail
                        task={selectedTask}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onClose={() => setSelectedTaskId(null)}
                        subjects={subjects}
                    />
                </div>
            ) : (
                <div className="hidden lg:flex flex-1 items-center justify-center text-muted-foreground bg-muted/10">
                    <div className="text-center space-y-2">
                        <p className="text-lg font-medium">No task selected</p>
                        <p className="text-sm">Select a task to view details</p>
                    </div>
                </div>
            )}
        </div>
    );
}
