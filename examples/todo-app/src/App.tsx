import { createTask, Task } from "@gtd/sdk";
import { useAction, useObjects, useLiveObjectSet } from "@bobbyfidz/osdk-react";
import React from "react";

function App() {
    const { objects: tasks } = useObjects(Task, { $orderBy: { completedAt: "asc" } });
    useLiveObjectSet(Task);

    const [title, setTitle] = React.useState("");
    const [isPending, addTask] = useAction(createTask);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl">My tasks</h1>
            <div className="flex flex-col gap-2">
                <textarea
                    className="rounded border-2 border-gray-300 p-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <button
                    className="rounded bg-blue-500 p-2 text-white"
                    type="button"
                    disabled={isPending}
                    onClick={() => addTask({ title })}
                >
                    Add task
                </button>
            </div>
            <div className="flex flex-col gap-2">
                {tasks.map((task) => (
                    <div key={task.$primaryKey}>
                        <input checked={task.completedAt !== undefined} type="checkbox" />
                        <span>{task.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
