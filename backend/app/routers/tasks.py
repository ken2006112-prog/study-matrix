from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.db import db
from app.schemas import Task, TaskCreate, TaskUpdate

router = APIRouter()

@router.post("/tasks/", response_model=Task)
async def create_task(task: TaskCreate):
    # TODO: Get actual user ID from auth
    user_id = 1 
    
    data = task.model_dump(exclude_unset=True)
    data['userId'] = user_id
    
    new_task = await db.task.create(data=data)
    return new_task

@router.get("/tasks/", response_model=List[Task])
async def get_tasks(
    subject_id: Optional[int] = Query(None, alias="subjectId"),
    is_completed: Optional[bool] = Query(None, alias="isCompleted")
):
    # TODO: Filter by user ID
    where = {}
    if subject_id is not None:
        where['subjectId'] = subject_id
    if is_completed is not None:
        where['isCompleted'] = is_completed
        
    tasks = await db.task.find_many(
        where=where, 
        order={'createdAt': 'desc'},
        include={'subject': True}
    )
    return tasks

@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: int):
    task = await db.task.find_unique(
        where={'id': task_id},
        include={'subject': True}
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: int, task_update: TaskUpdate):
    existing_task = await db.task.find_unique(where={'id': task_id})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    data = task_update.model_dump(exclude_unset=True)
    
    updated_task = await db.task.update(
        where={'id': task_id},
        data=data
    )
    return updated_task

@router.delete("/tasks/{task_id}", response_model=Task)
async def delete_task(task_id: int):
    existing_task = await db.task.find_unique(where={'id': task_id})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    deleted_task = await db.task.delete(where={'id': task_id})
    return deleted_task
