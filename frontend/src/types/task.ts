export interface Task {
    id: number;
    title: string;
    description?: string;
    isCompleted: boolean;
    dueDate?: string;
    priority: number; // 0: None, 1: Low, 2: Medium, 3: High
    subjectId?: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
    subject?: {
        id: number;
        name: string;
        color: string;
    };
}

export interface TaskCreate {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: number;
    subjectId?: number;
}

export interface TaskUpdate {
    title?: string;
    description?: string;
    isCompleted?: boolean;
    dueDate?: string;
    priority?: number;
    subjectId?: number;
}
