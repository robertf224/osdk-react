import { useState } from "react";
import { createTask, Task } from "@gtd/sdk";
import { createClient, Osdk, ObjectSet, ObjectTypeDefinition } from "@osdk/client";

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <h1 className="text-2xl">Vite + React</h1>
            <div className="rounded-4xl border shadow-2xl">
                <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <p className="text-xl">Click on the Vite and React logos to learn more</p>
        </>
    );
}

export default App;
