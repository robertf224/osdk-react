import { Task } from "@gtd/sdk";
import { useList } from "@bobbyfidz/osdk-react";
import { Osdk } from "@osdk/client";

const orderBy = { createdAt: "desc" } as const;

function App() {
    const { objects } = useList(Task, { $orderBy: orderBy });
    const tasks = objects as Osdk<Task>[];

    return (
        <>
            <h1 className="text-2xl">My tasks</h1>
            <div className="flex flex-col gap-2">
                {tasks.map((task) => (
                    <div>{task.title}</div>
                ))}
            </div>
        </>
    );
}

export default App;
