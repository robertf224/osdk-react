import { Task } from "@gtd/sdk";
import { useList, useLiveSet } from "@bobbyfidz/osdk-react";
import { Osdk } from "@osdk/client";

function App() {
    const { objects } = useList(Task, { $orderBy: { completedAt: "asc" } });
    useLiveSet(Task, {});
    const tasks = objects as Osdk<Task>[];

    return (
        <>
            <h1 className="text-2xl">My tasks</h1>
            <div className="flex flex-col gap-2">
                {tasks.map((task) => (
                    <div key={task.$primaryKey}>{task.title}</div>
                ))}
            </div>
        </>
    );
}

export default App;
