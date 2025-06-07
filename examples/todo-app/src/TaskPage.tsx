import { useAction, useObject } from "@bobbyfidz/osdk-react";
import { Task, deleteTask } from "@gtd/sdk";
import { useParams, Link, useNavigate } from "react-router";

function TaskPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task] = useObject(Task, { id: taskId! });

    const [applyDeleteTask, isDeleting] = useAction(deleteTask);
    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            applyDeleteTask({ Task: task! }, { onCompleted: () => navigate("/") });
        }
    };

    if (!task) {
        return <div className="flex h-screen items-center justify-center">Task not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto max-w-xl">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="text-blue-500 hover:text-blue-600">
                        ← Back to Home
                    </Link>
                    <h1 className="text-2xl font-bold">Task Details</h1>
                </div>
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">{task.title}</h2>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">
                            Status: {task.completedAt ? "Completed" : "In Progress"}
                        </p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Created: {new Date(task.createdAt!).toLocaleString()}</p>
                    </div>
                    {task.completedAt && (
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Completed: {new Date(task.completedAt).toLocaleString()}
                            </p>
                        </div>
                    )}
                    <div className="mt-6">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                        >
                            {isDeleting ? "Deleting..." : "Delete Task"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskPage;
