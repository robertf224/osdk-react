import { useAction, useObject } from "@bobbyfidz/osdk-react";
import { Task, deleteTask, editTask } from "@gtd/sdk";
import { useParams, Link, useNavigate } from "react-router";
import { useState } from "react";

function TaskPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { data: task } = useObject(Task, taskId!);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");

    const { mutate: applyDeleteTask, isPending: isDeleting } = useAction(deleteTask);
    const { mutate: applyEditTask, isPending: isEditing } = useAction(editTask);

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            applyDeleteTask({ Task: task! }, { onSuccess: () => navigate("/") });
        }
    };

    const handleEdit = () => {
        if (!editedTitle.trim()) return;
        applyEditTask(
            {
                Task: task!,
                title: editedTitle,
            },
            {
                onSuccess: () => {
                    setIsEditMode(false);
                    setEditedTitle("");
                },
            }
        );
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
                    <div className="mb-4 flex items-center justify-between">
                        {isEditMode ? (
                            <div className="flex flex-1 items-center gap-2">
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="flex-1 rounded border border-gray-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="Enter new title"
                                />
                                <button
                                    onClick={handleEdit}
                                    disabled={isEditing}
                                    className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {isEditing ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setEditedTitle("");
                                    }}
                                    className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold">{task.title}</h2>
                                <button
                                    onClick={() => {
                                        setIsEditMode(true);
                                        setEditedTitle(task.title!);
                                    }}
                                    className="ml-2 rounded bg-gray-100 px-3 py-1 text-gray-600 hover:bg-gray-200"
                                >
                                    Edit
                                </button>
                            </>
                        )}
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
