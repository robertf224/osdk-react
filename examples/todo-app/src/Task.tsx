import React from "react";
import { Task, editTask } from "@gtd/sdk";
import { Osdk } from "@osdk/client";
import { useAction } from "@bobbyfidz/osdk-react";

interface TaskItemProps {
    task: Osdk<Task>;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    const [edit, isPending] = useAction(editTask);

    const handleToggle = () => {
        // Toggle the task: if it is complete, set completedAt to undefined (incomplete),
        // otherwise set it to the current time (complete)
        edit({
            Task: task,
            title: task.title!,
            completed_at: task.completedAt ? undefined : new Date().toISOString(),
        });
    };

    return (
        <div className="flex items-center justify-between rounded border border-gray-300 p-2 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!task.completedAt}
                    onChange={handleToggle}
                    disabled={isPending}
                />
                <span className={`text-lg ${task.completedAt ? "text-gray-500 line-through" : "text-black"}`}>
                    {task.title}
                </span>
            </div>
        </div>
    );
};

export default TaskItem;
