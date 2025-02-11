import { createTask, Task } from "@gtd/sdk";
import { useAction, useObjects, useLiveObjectSet } from "@bobbyfidz/osdk-react";
import React from "react";
import TaskItem from "./Task";

function App() {
    const { objects: tasks } = useObjects(Task, { $orderBy: { completedAt: "asc", createdAt: "desc" } });
    useLiveObjectSet(Task);

    const [title, setTitle] = React.useState("");
    const [addTask, isPending] = useAction(createTask);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
                <h1 className="mb-4 text-center text-3xl font-bold">Todo App</h1>
                <div className="mb-4">
                    <textarea
                        className="mb-2 w-full rounded border border-gray-300 p-2"
                        placeholder="What's your next task?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <button
                        className="w-full rounded bg-blue-500 py-2 text-white disabled:opacity-50"
                        type="button"
                        disabled={isPending || title.trim() === ""}
                        onClick={() => addTask({ title }, { onCompleted: () => setTitle("") })}
                    >
                        Add Task
                    </button>
                </div>
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <TaskItem key={task.$primaryKey} task={task} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;
