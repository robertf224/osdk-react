import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { OsdkEnvironmentProvider } from "@bobbyfidz/osdk-react";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import App from "./App";
import Login from "./Login";
import AuthCallback from "./AuthCallback";
import "./globals.css";
import { client } from "./client";

const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <App />,
        },
        {
            path: "/login",
            element: <Login />,
        },
        {
            path: "/auth/callback",
            element: <AuthCallback />,
        },
    ],
    { basename: import.meta.env.BASE_URL }
);

// TODO: re-add StrictMode
createRoot(document.getElementById("root")!).render(
    <OsdkEnvironmentProvider client={client}>
        <Suspense fallback="Loading...">
            <RouterProvider router={router} />
        </Suspense>
    </OsdkEnvironmentProvider>
);
